# analytics/src/data_processing/data_cleaner.py

import pandas as pd
import numpy as np
from typing import Dict, Any
import logging
from sklearn.impute import KNNImputer
from sklearn.preprocessing import StandardScaler
from scipy import stats

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def remove_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        initial_rows = len(df)
        df.drop_duplicates(inplace=True)
        removed_rows = initial_rows - len(df)
        logger.info(f"Removed {removed_rows} duplicate rows")
        return df

    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        # For numerical columns, use KNN imputation
        num_cols = df.select_dtypes(include=[np.number]).columns
        knn_imputer = KNNImputer(n_neighbors=5)
        df[num_cols] = knn_imputer.fit_transform(df[num_cols])

        # For categorical columns, use mode imputation
        cat_cols = df.select_dtypes(include=['object']).columns
        for col in cat_cols:
            df[col].fillna(df[col].mode()[0], inplace=True)

        logger.info("Handled missing values")
        return df

    def remove_outliers(self, df: pd.DataFrame, columns: list) -> pd.DataFrame:
        for col in columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
        
        logger.info(f"Removed outliers from columns: {columns}")
        return df

    def normalize_data(self, df: pd.DataFrame, columns: list) -> pd.DataFrame:
        scaler = StandardScaler()
        df[columns] = scaler.fit_transform(df[columns])
        logger.info(f"Normalized columns: {columns}")
        return df

    def handle_inconsistent_categories(self, df: pd.DataFrame, column: str, mapping: Dict[str, str]) -> pd.DataFrame:
        df[column] = df[column].replace(mapping)
        logger.info(f"Handled inconsistent categories in column: {column}")
        return df

    def validate_data_types(self, df: pd.DataFrame, expected_types: Dict[str, str]) -> pd.DataFrame:
        for col, expected_type in expected_types.items():
            if df[col].dtype != expected_type:
                try:
                    df[col] = df[col].astype(expected_type)
                    logger.info(f"Converted {col} to {expected_type}")
                except ValueError:
                    logger.warning(f"Could not convert {col} to {expected_type}")
        return df

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        df = self.remove_duplicates(df)
        df = self.handle_missing_values(df)
        df = self.remove_outliers(df, ['age_days', 'price', 'quantity'])
        df = self.normalize_data(df, ['age_days', 'price', 'quantity'])
        df = self.handle_inconsistent_categories(df, 'category', {'Electronics': 'electronic', 'electronic': 'Electronics'})
        
        expected_types = {
            'product_id': 'int64',
            'name': 'object',
            'category': 'object',
            'price': 'float64',
            'quantity': 'int64',
            'manufacturing_date': 'datetime64[ns]'
        }
        df = self.validate_data_types(df, expected_types)
        
        return df

if __name__ == "__main__":
    # Example usage
    config = {}  # Add any necessary configuration
    cleaner = DataCleaner(config)
    
    # Load your data
    df = pd.read_csv('your_data.csv')
    
    # Clean the data
    cleaned_df = cleaner.clean_data(df)
    
    # Save the cleaned data
    cleaned_df.to_csv('cleaned_data.csv', index=False)
    logger.info("Data cleaning process completed")
