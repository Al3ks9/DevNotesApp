from enum import Enum


class NoteType(str, Enum):
    note = "note"
    snippet = "snippet"
    document = "document"
