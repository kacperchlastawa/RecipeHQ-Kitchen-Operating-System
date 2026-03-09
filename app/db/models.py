from sqlalchemy import String, BigInteger, ForeignKey, Enum, Text
from sqlalchemy.orm import DeclarativeBase, Mapped,mapped_column, relationship
from typing import List, Optional
from enum import Enum

from urllib3.poolmanager import PoolKey


class Base(DeclarativeBase):
    pass

class User():
    def __init__(self, id:PoolKey, login, password):
        self.id = id
        self.login = login
        self.password = password

class Project():
    def __init__(self, id:PoolKey, name:str, description: Text, total_files_size: BigInteger = 0):
        self.id = id
        self.name = name
        self.description = description
        self.total_files_size = total_files_size

    #todo : relacje - lista dokumentów przypisanych do projektu, lista uczestników
    #todo : ustaw cascade = "all, delete-orphan" w relacji do dokumentów.

class ProjectParticipant():
    def __init__(self, id:PoolKey, user_id:ForeignKey, project_id:ForeignKey):
        self.id = id
        self.user_id = user_id
        self.project_id = project_id
        #role

#todo Enum z rolami owner i participant - przechowywane w sqlenum

class Document():
    def __init__(self, id:PoolKey, project_id:ForeignKey, file_name, s3_key, file_size :BigInteger):
        self.id = id
        self.project_id = project_id
        self.file_name = file_name
        self.s3_key = s3_key
        self.file_size = file_size

        #todo relacje - odnośnik powrotny do projektu