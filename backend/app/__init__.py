from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from dotenv import load_dotenv
# Imports mein add karo (top):
import cloudinary

# After CORS(...) ke baad add karo:
cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
)
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
migrate = Migrate()
load_dotenv()
limiter = Limiter(get_remote_address)

def create_app(config_name='default'):
    app = Flask(__name__)
    
    from config import config
    app.config.from_object(config[config_name])
    print("DB URI:", app.config['SQLALCHEMY_DATABASE_URI'])
    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)
    CORS(app,
        resources={r"/api/*": {"origins": [
            "http://localhost:3000",
            "https://edu-erp-frontend.onrender.com"
        ]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.principal import principal_bp, teacher_bp as teacher_self_bp
    from app.routes.teacher import teacher_bp
    from app.routes.student import student_bp

    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(admin_bp,     url_prefix='/api/admin')
    app.register_blueprint(principal_bp, url_prefix='/api/principal')

    app.register_blueprint(teacher_bp,        url_prefix='/api/teacher')
    app.register_blueprint(teacher_self_bp,   url_prefix='/api/teacher')
    app.register_blueprint(student_bp,   url_prefix='/api/student')

    # Create tables on first run
    with app.app_context():
        db.create_all()
        _seed_super_admin()

    return app


def _seed_super_admin():
    from app.models.user import User, UserRole
    import os
    if not User.query.filter_by(role=UserRole.SUPER_ADMIN).first():
        email    = os.environ.get('SUPER_ADMIN_EMAIL', 'admin@eduErp.com')
        password = os.environ.get('SUPER_ADMIN_PASSWORD')
        if not password:
            raise RuntimeError(
                "Set SUPER_ADMIN_PASSWORD env var before first run."
            )
        admin = User(name='Super Admin', email=email, role=UserRole.SUPER_ADMIN)
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
