# analytics/src/data_processing/etl.py

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from pymongo import MongoClient
from kafka import KafkaConsumer
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SupplyChainETL:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.sql_engine = create_engine(config['sql_connection_string'])
        self.mongo_client = MongoClient(config['mongo_connection_string'])
        self.kafka_consumer = KafkaConsumer(
            config['kafka_topic'],
            bootstrap_servers=config['kafka_bootstrap_servers'],
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            group_id=config['kafka_consumer_group']
        )

    def extract_sql_data(self, query: str) -> pd.DataFrame:
        try:
            return pd.read_sql(query, self.sql_engine)
        except Exception as e:
            logger.error(f"Error extracting SQL data: {str(e)}")
            raise

    def extract_mongo_data(self, collection: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            db = self.mongo_client[self.config['mongo_db_name']]
            return list(db[collection].find(query))
        except Exception as e:
            logger.error(f"Error extracting MongoDB data: {str(e)}")
            raise

    def extract_kafka_data(self, timeout_ms: int = 10000) -> List[Dict[str, Any]]:
        messages = []
        try:
            for message in self.kafka_consumer:
                messages.append(message.value)
                if self.kafka_consumer.poll(timeout_ms=timeout_ms) == {}:
                    break
        except Exception as e:
            logger.error(f"Error extracting Kafka data: {str(e)}")
        return messages

    def transform_product_data(self, data: pd.DataFrame) -> pd.DataFrame:
        # Implement complex transformations here
        data['manufacturing_date'] = pd.to_datetime(data['manufacturing_date'])
        data['age_days'] = (datetime.now() - data['manufacturing_date']).dt.days
        data['is_expired'] = data['age_days'] > data['shelf_life_days']
        
        # Calculate average time between transfers
        transfer_times = data.groupby('product_id')['transfer_date'].diff().mean()
        data['avg_transfer_time'] = data['product_id'].map(transfer_times)
        
        # Implement more transformations as needed
        return data

    def transform_certification_data(self, data: List[Dict[str, Any]]) -> pd.DataFrame:
        df = pd.DataFrame(data)
        df['certification_date'] = pd.to_datetime(df['certification_date'])
        df['expiration_date'] = pd.to_datetime(df['expiration_date'])
        df['is_valid'] = df['expiration_date'] > datetime.now()
        
        # Calculate certification duration
        df['certification_duration'] = (df['expiration_date'] - df['certification_date']).dt.days
        
        # Implement more transformations as needed
        return df

    def load_data(self, data: pd.DataFrame, table_name: str):
        try:
            data.to_sql(table_name, self.sql_engine, if_exists='append', index=False)
            logger.info(f"Successfully loaded {len(data)} rows into {table_name}")
        except Exception as e:
            logger.error(f"Error loading data into {table_name}: {str(e)}")
            raise

    def run_etl_process(self):
        try:
            # Extract data
            product_data = self.extract_sql_data("SELECT * FROM products WHERE last_updated > (NOW() - INTERVAL 1 DAY)")
            certification_data = self.extract_mongo_data("certifications", {"status": "active"})
            kafka_data = self.extract_kafka_data()

            # Transform data
            transformed_product_data = self.transform_product_data(product_data)
            transformed_certification_data = self.transform_certification_data(certification_data)

            # Load data
            with ThreadPoolExecutor(max_workers=3) as executor:
                executor.submit(self.load_data, transformed_product_data, "analytics_products")
                executor.submit(self.load_data, transformed_certification_data, "analytics_certifications")
                executor.submit(self.process_kafka_data, kafka_data)

            logger.info("ETL process completed successfully")
        except Exception as e:
            logger.error(f"Error in ETL process: {str(e)}")

    def process_kafka_data(self, kafka_data: List[Dict[str, Any]]):
        # Process real-time data from Kafka
        # Implement your logic here
        pass

if __name__ == "__main__":
    config = {
        'sql_connection_string': 'postgresql://user:password@localhost:5432/supplychain',
        'mongo_connection_string': 'mongodb://localhost:27017/',
        'mongo_db_name': 'supplychain',
        'kafka_topic': 'supplychain_events',
        'kafka_bootstrap_servers': ['localhost:9092'],
        'kafka_consumer_group': 'supplychain_analytics'
    }
    
    etl = SupplyChainETL(config)
    etl.run_etl_process()
