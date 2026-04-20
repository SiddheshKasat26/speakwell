from pydantic import BaseModel
from typing import Optional

class AnalysisResponse(BaseModel):
    task_id: str
    status: str
    message: Optional[str] = None