from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel


class JoinMessage(BaseModel):
    type: Literal["join"] = "join"
    userId: str


class UpdateMessage(BaseModel):
    type: Literal["update"] = "update"
    content: str
    timestamp: int


class InitResponse(BaseModel):
    type: Literal["init"] = "init"
    content: str
    users: List[str]
    lastEditedBy: Optional[str] = None
    lastEditedAt: Optional[str] = None


class UpdateResponse(BaseModel):
    type: Literal["update"] = "update"
    content: str
    userId: str
    timestamp: int


class UserJoinedResponse(BaseModel):
    type: Literal["user_joined"] = "user_joined"
    userId: str
    users: List[str]


class UserLeftResponse(BaseModel):
    type: Literal["user_left"] = "user_left"
    userId: str
    users: List[str]


class SavedResponse(BaseModel):
    type: Literal["saved"] = "saved"
    timestamp: str


class ErrorResponse(BaseModel):
    type: Literal["error"] = "error"
    message: str


class DocumentResponse(BaseModel):
    id: str
    content: str
    updated_at: datetime
    last_edited_by: Optional[str] = None

    class Config:
        from_attributes = True


class RevisionResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    edited_by: Optional[str] = None

    class Config:
        from_attributes = True
