# analytics/src/models/anomaly_detection.py

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, classification_report
import joblib
import logging
from typing import Dict, Any, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SupplyChainAnomalyDetection:
    def __init__(self, config: Dict[str, Any]):
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

if __name__ == "__main__":
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
