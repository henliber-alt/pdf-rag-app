from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "PDF RAG API"
    database_url: str
    openai_api_key: str
    google_drive_folder_id: str
    google_service_account_file: str
    embedding_model: str = "text-embedding-3-large"
    chat_model: str = "gpt-5-mini"
    app_base_url: str = "http://localhost:3000"


settings = Settings()
