# analytics/src/models/predictive_model.py

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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SupplyChainPredictiveModel:
    def __init__(self, config: Dict[str, Any]):
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

if __name__ == "__main__":
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
