# Flagged entries

Entries a reader flagged as looking wrong, newest first, written here by `scripts/apply_review.py`
from a review report (see `docs/review.md`). Each line gives the record, the revision it was
flagged on, the reasons and the reader's words. An agent acts on a flag (reads the entry against
its sources and corrects it, or answers why it stands), then deletes its line. A corrected entry
has a new revision, so it comes back into the editor's queue by itself.

<!-- flags -->
