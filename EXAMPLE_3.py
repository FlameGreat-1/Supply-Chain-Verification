analytics/src/data_processing/etl.py
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from pymongo import MongoClient
from kafka import KafkaConsumer
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any
from datetime import datetime, timedelta

Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(name)
class SupplyChainETL:
def init(self, config: Dict[str, Any]):
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


if name == "main":
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



analytics/src/data_processing/data_cleaner.py
import pandas as pd
import numpy as np
from typing import Dict, Any
import logging
from sklearn.impute import KNNImputer
from sklearn.preprocessing import StandardScaler
from scipy import stats

Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(name)
class DataCleaner:
def init(self, config: Dict[str, Any]):
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


if name == "main":
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



analytics/src/models/predictive_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import logging
from typing import Dict, Any, Tuple

Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(name)
class SupplyChainPredictiveModel:
def init(self, config: Dict[str, Any]):
self.config = config
self.model = None
self.scaler = StandardScaler()

def prepare_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    # Select features and target
    features = ['age_days', 'price', 'quantity', 'avg_transfer_time']
    target = 'days_until_next_transfer'

    X = df[features]
    y = df[target]

    # Encode categorical variables
    X = pd.get_dummies(X, columns=['category'], drop_first=True)

    return X.values, y.values

def train_model(self, X: np.ndarray, y: np.ndarray):
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Create a pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('rf', RandomForestRegressor(random_state=42))
    ])

    # Define hyperparameters for grid search
    param_grid = {
        'rf__n_estimators': [100, 200, 300],
        'rf__max_depth': [None, 10, 20, 30],
        'rf__min_samples_split': [2, 5, 10],
        'rf__min_samples_leaf': [1, 2, 4]
    }

    # Perform grid search
    grid_search = GridSearchCV(pipeline, param_grid, cv=5, n_jobs=-1, verbose=1)
    grid_search.fit(X_train, y_train)

    # Get the best model
    self.model = grid_search.best_estimator_

    # Evaluate the model
    y_pred = self.model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    logger.info(f"Model trained. MSE: {mse}, R2 Score: {r2}")
    logger.info(f"Best parameters: {grid_search.best_params_}")

def predict(self, X: np.ndarray) -> np.ndarray:
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    return self.model.predict(X)

def save_model(self, filepath: str):
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    joblib.dump(self.model, filepath)
    logger.info(f"Model saved to {filepath}")

def load_model(self, filepath: str):
    self.model = joblib.load(filepath)
    logger.info(f"Model loaded from {filepath}")

def feature_importance(self) -> pd.DataFrame:
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    
    feature_importance = self.model.named_steps['rf'].feature_importances_
    feature_names = self.model.named_steps['rf'].feature_names_in_
    
    importance_df = pd.DataFrame({'feature': feature_names, 'importance': feature_importance})
    importance_df = importance_df.sort_values('importance', ascending=False)
    
    return importance_df


if name == "main":
# Example usage
config = {}  # Add any necessary configuration
model = SupplyChainPredictiveModel(config)

# Load and prepare your data
df = pd.read_csv('your_cleaned_data.csv')
X, y = model.prepare_data(df)

# Train the model
model.train_model(X, y)

# Make predictions
new_data = np.array([[100, 50.0, 1000, 5]])  # Example new data point
prediction = model.predict(new_data)
logger.info(f"Prediction: {prediction}")

# Save the model
model.save_model('supply_chain_model.joblib')

# Get feature importance
importance = model.feature_importance()
logger.info("Feature Importance:")
logger.info(importance)



analytics/src/models/anomaly_detection.py
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
import joblib
import logging
from typing import Dict, Any, Tuple

Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(name)
class SupplyChainAnomalyDetection:
def init(self, config: Dict[str, Any]):
self.config = config
self.model = None
self.scaler = StandardScaler()

def prepare_data(self, df: pd.DataFrame) -> np.ndarray:
    # Select features for anomaly detection
    features = ['price', 'quantity', 'avg_transfer_time', 'age_days']
    X = df[features]

    # Encode categorical variables if any
    X = pd.get_dummies(X, columns=['category'], drop_first=True)

    # Scale the features
    X_scaled = self.scaler.fit_transform(X)

    return X_scaled

def train_model(self, X: np.ndarray, contamination: float = 0.1):
    # Split the data
    X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)

    # Train the Isolation Forest model
    self.model = IsolationForest(contamination=contamination, random_state=42, n_jobs=-1)
    self.model.fit(X_train)

    # Evaluate the model
    y_pred_train = self.model.predict(X_train)
    y_pred_test = self.model.predict(X_test)

    # Convert predictions to binary (1 for inliers, 0 for outliers)
    y_pred_train = np.where(y_pred_train == 1, 1, 0)
          y_pred_test = np.where(y_pred_test == 1, 1, 0)

    # Calculate the anomaly ratio
    anomaly_ratio = np.mean(y_pred_test == 0)
    logger.info(f"Anomaly ratio: {anomaly_ratio:.2%}")

    logger.info("Model trained successfully")

def detect_anomalies(self, X: np.ndarray) -> np.ndarray:
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    
    # Scale the input data
    X_scaled = self.scaler.transform(X)
    
    # Predict anomalies
    predictions = self.model.predict(X_scaled)
    
    # Convert predictions to binary (1 for inliers, 0 for outliers)
    return np.where(predictions == 1, 1, 0)

def save_model(self, filepath: str):
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    joblib.dump((self.model, self.scaler), filepath)
    logger.info(f"Model and scaler saved to {filepath}")

def load_model(self, filepath: str):
    self.model, self.scaler = joblib.load(filepath)
    logger.info(f"Model and scaler loaded from {filepath}")

def evaluate_model(self, X: np.ndarray, y_true: np.ndarray) -> Dict[str, Any]:
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    
    y_pred = self.detect_anomalies(X)
    
    # Calculate evaluation metrics
    cm = confusion_matrix(y_true, y_pred)
    cr = classification_report(y_true, y_pred, output_dict=True)
    
    return {
        "confusion_matrix": cm,
        "classification_report": cr
    }

def explain_anomalies(self, X: np.ndarray, feature_names: List[str]) -> pd.DataFrame:
    if self.model is None:
        raise ValueError("Model has not been trained yet.")
    
    # Get anomaly scores
    anomaly_scores = -self.model.score_samples(X)
    
    # Create a DataFrame with feature names and their corresponding anomaly scores
    anomaly_contribution = pd.DataFrame(X, columns=feature_names)
    anomaly_contribution['anomaly_score'] = anomaly_scores
    
    # Calculate the correlation between features and anomaly scores
    correlations = anomaly_contribution.corr()['anomaly_score'].sort_values(ascending=False)
    
    return correlations


if name == "main":
# Example usage
config = {
'contamination': 0.1,
'random_state': 42
}
anomaly_detector = SupplyChainAnomalyDetection(config)

# Load and prepare your data
df = pd.read_csv('your_cleaned_data.csv')
X = anomaly_detector.prepare_data(df)

# Train the model
anomaly_detector.train_model(X)

# Detect anomalies in new data
new_data = np.array([[100, 50.0, 1000, 5]])  # Example new data point
anomalies = anomaly_detector.detect_anomalies(new_data)
logger.info(f"Anomaly detection result: {anomalies}")

# Save the model
anomaly_detector.save_model('supply_chain_anomaly_model.joblib')

# Evaluate the model (assuming you have true labels)
y_true = np.array([1, 0, 1, 1, 0])  # Example true labels
evaluation_results = anomaly_detector.evaluate_model(X[:5], y_true)
logger.info("Model Evaluation Results:")
logger.info(f"Confusion Matrix:\n{evaluation_results['confusion_matrix']}")
logger.info(f"Classification Report:\n{evaluation_results['classification_report']}")

# Explain anomalies
feature_names = ['price', 'quantity', 'avg_transfer_time', 'age_days']
anomaly_explanations = anomaly_detector.explain_anomalies(X, feature_names)
logger.info("Anomaly Explanations (Feature Correlations with Anomaly Scores):")
logger.info(anomaly_explanations)

# analytics/src/visualization/dashboard.py

import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.express as px
import plotly.graph_objs as go
import pandas as pd
import numpy as np
from typing import Dict, Any
import logging
from sqlalchemy import create_engine
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SupplyChainDashboard:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.app = dash.Dash(__name__)
        self.db_engine = create_engine(config['sql_connection_string'])
        self.setup_layout()
        self.setup_callbacks()

    def load_data(self) -> pd.DataFrame:
        query = """
        SELECT p.*, c.certification_body, c.certification_date, c.expiration_date,
               e.score_category, e.score, e.assessment_date
        FROM analytics_products p
        LEFT JOIN analytics_certifications c ON p.product_id = c.product_id
        LEFT JOIN analytics_ethical_scores e ON p.product_id = e.product_id
        WHERE p.last_updated >= NOW() - INTERVAL '30 days'
        """
        return pd.read_sql(query, self.db_engine)

    def setup_layout(self):
        self.app.layout = html.Div([
            html.H1("Supply Chain Analytics Dashboard"),
            
            dcc.Tabs([
                dcc.Tab(label="Overview", children=[
                    html.Div([
                        dcc.Graph(id='product-category-distribution'),
                        dcc.Graph(id='daily-transfers')
                    ])
                ]),
                dcc.Tab(label="Product Tracking", children=[
                    html.Div([
                        dcc.Dropdown(id='product-dropdown', placeholder="Select a product"),
                        dcc.Graph(id='product-journey-map'),
                        dcc.Graph(id='product-transfer-timeline')
                    ])
                ]),
                dcc.Tab(label="Ethical Sourcing", children=[
                    html.Div([
                        dcc.Graph(id='ethical-score-distribution'),
                        dcc.Graph(id='certification-status')
                    ])
                ]),
                dcc.Tab(label="Anomaly Detection", children=[
                    html.Div([
                        dcc.Graph(id='anomaly-detection-results'),
                        dcc.Graph(id='anomaly-feature-importance')
                    ])
                ])
            ]),
            
            dcc.Interval(
                id='interval-component',
                interval=300*1000,  # Update every 5 minutes
                n_intervals=0
       