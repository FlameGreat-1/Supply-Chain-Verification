import dash
from dash import dcc, html
from dash.dependencies import Input, Output, State
import plotly.express as px
import plotly.graph_objs as go
import pandas as pd
import numpy as np
from typing import Dict, Any
import logging
from sqlalchemy import create_engine
from datetime import datetime, timedelta
import jwt
from flask import request, abort, jsonify
import bcrypt

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SupplyChainDashboard:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.app = dash.Dash(__name__, suppress_callback_exceptions=True)
        self.db_engine = create_engine(config['sql_connection_string'])
        self.jwt_secret = config['jwt_secret']
        self.setup_layout()
        self.setup_callbacks()

    def verify_token(self):
        token = request.cookies.get('token')
        if not token:
            abort(401, description="Authentication token is missing")
        try:
            jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            abort(401, description="Authentication token has expired")
        except jwt.InvalidTokenError:
            abort(401, description="Invalid authentication token")

    def load_data(self) -> pd.DataFrame:
        query = """
        SELECT 
            p.id AS product_id,
            p.name,
            p.manufacturer,
            p.manufacturing_date,
            p.batch_number,
            p.current_owner,
            p.category,
            p.price,
            p.quantity,
            p.last_updated,
            c.certification_body,
            c.certification_date,
            c.expiration_date,
            e.score_category,
            e.score,
            e.assessment_date,
            t.transfer_date,
            t.from_owner,
            t.to_owner,
            t.location,
            t.latitude,
            t.longitude
        FROM products p
        LEFT JOIN certifications c ON p.id = c.product_id
        LEFT JOIN ethical_scores e ON p.id = e.product_id
        LEFT JOIN transfers t ON p.id = t.product_id
        WHERE p.last_updated >= NOW() - INTERVAL '30 days'
        """
        return pd.read_sql(query, self.db_engine)

    def setup_layout(self):
        self.app.layout = html.Div([
            dcc.Location(id='url', refresh=False),
            html.Div(id='page-content')
        ])

    def login_layout(self):
        return html.Div([
            html.H2('Login'),
            dcc.Input(id='username-input', type='text', placeholder='Username'),
            dcc.Input(id='password-input', type='password', placeholder='Password'),
            html.Button('Login', id='login-button'),
            html.Div(id='login-output')
        ])

    def main_layout(self):
        return html.Div([
            html.H1("Supply Chain Analytics Dashboard"),
            html.Button('Logout', id='logout-button'),
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
            )
        ])

    def setup_callbacks(self):
        @self.app.server.before_request
        def authenticate():
            if request.path != '/login' and 'token' not in request.cookies:
                abort(401, description="Authentication required")
            if request.path != '/login':
                self.verify_token()

        @self.app.callback(Output('page-content', 'children'),
                           Input('url', 'pathname'))
        def display_page(pathname):
            if pathname == '/login' or 'token' not in request.cookies:
                return self.login_layout()
            else:
                return self.main_layout()

        @self.app.callback(
            Output('login-output', 'children'),
            Input('login-button', 'n_clicks'),
            State('username-input', 'value'),
            State('password-input', 'value')
        )
        def login(n_clicks, username, password):
            if n_clicks is None:
                return ''
            # In a real application, you would verify against a database
            if username == 'admin' and password == 'password':
                token = jwt.encode({'user': username, 'exp': datetime.utcnow() + timedelta(hours=1)},
                                   self.jwt_secret, algorithm="HS256")
                response = jsonify({'success': True, 'redirect': '/'})
                response.set_cookie('token', token, httponly=True, secure=True)
                return response
            else:
                return 'Invalid credentials'

        @self.app.callback(
            Output('url', 'pathname'),
            Input('logout-button', 'n_clicks'),
        )
        def logout(n_clicks):
            if n_clicks is None:
                return dash.no_update
            response = jsonify({'success': True})
            response.delete_cookie('token')
            return '/login'

        @self.app.callback(
            [Output('product-category-distribution', 'figure'),
             Output('daily-transfers', 'figure'),
             Output('product-dropdown', 'options'),
             Output('ethical-score-distribution', 'figure'),
             Output('certification-status', 'figure')],
            [Input('interval-component', 'n_intervals')]
        )
        def update_graphs(n):
            df = self.load_data()
            
            # Product Category Distribution
            category_dist = df['category'].value_counts()
            fig_category = px.pie(values=category_dist.values, names=category_dist.index, title="Product Category Distribution")
            
            # Daily Transfers
            daily_transfers = df.groupby('transfer_date')['product_id'].count().reset_index()
            fig_transfers = px.line(daily_transfers, x='transfer_date', y='product_id', title="Daily Product Transfers")
            
            # Product Dropdown Options
            product_options = [{'label': f"{row['name']} (ID: {row['product_id']})", 'value': row['product_id']} 
                               for _, row in df[['product_id', 'name']].drop_duplicates().iterrows()]
            
            # Ethical Score Distribution
            fig_ethical = px.box(df, x='score_category', y='score', title="Ethical Score Distribution by Category")
            
            # Certification Status
            cert_status = df['certification_body'].notna().value_counts()
            fig_cert = px.pie(values=cert_status.values, names=['Certified', 'Not Certified'], title="Product Certification Status")
            
            return fig_category, fig_transfers, product_options, fig_ethical, fig_cert

        @self.app.callback(
            [Output('product-journey-map', 'figure'),
             Output('product-transfer-timeline', 'figure')],
            [Input('product-dropdown', 'value')]
        )
        def update_product_tracking(product_id):
            if not product_id:
                return go.Figure(), go.Figure()

            df = self.load_data()
            product_data = df[df['product_id'] == product_id]
            
            # Product Journey Map
            fig_journey = px.scatter_geo(product_data, lat='latitude', lon='longitude', 
                                         hover_name='location', title=f"Journey of Product {product_id}")
            
            # Product Transfer Timeline
            fig_timeline = px.timeline(product_data, x_start='transfer_date', x_end='transfer_date', 
                                       y='location', title=f"Transfer Timeline of Product {product_id}")
            
            return fig_journey, fig_timeline

        @self.app.callback(
            [Output('anomaly-detection-results', 'figure'),
             Output('anomaly-feature-importance', 'figure')],
            [Input('interval-component', 'n_intervals')]
        )
        def update_anomaly_detection(n):
            df = self.load_data()
            
            # Assuming anomaly detection has been run and results are stored in the database
            # This is a placeholder. In a real application, you would run your anomaly detection model here
            df['is_anomaly'] = np.random.choice([True, False], size=len(df), p=[0.05, 0.95])
            
            # Anomaly Detection Results
            fig_anomalies = px.scatter(df, x='transfer_date', y='price', color='is_anomaly',
                                       title="Anomaly Detection Results", hover_data=['product_id'])
            
            # Feature Importance for Anomalies
            feature_importance = pd.DataFrame({
                'feature': ['price', 'quantity', 'avg_transfer_time', 'age_days'],
                'importance': [0.3, 0.25, 0.2, 0.25]  # Example values, replace with actual importance scores
            })
            fig_importance = px.bar(feature_importance, x='feature', y='importance', 
                                    title="Feature Importance for Anomaly Detection")
            
            return fig_anomalies, fig_importance

    def run_dashboard(self):
        self.app.run_server(debug=True, host='0.0.0.0', port=8050)

if __name__ == "__main__":
    config = {
        'sql_connection_string': 'postgresql://user:password@localhost:5432/supplychain',
        'jwt_secret': 'your-secret-key'  # Make sure this matches the backend secret
    }
    dashboard = SupplyChainDashboard(config)
    dashboard.run_dashboard()
