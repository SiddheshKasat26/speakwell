## Known Limitations

### Filler Word Detection
- Whisper `small` model frequently drops short disfluencies 
  (um, uh, ah) during transcription
- These words never reach our filler_service.py counter
- Detected fillers are limited to words Whisper preserves
  (so, like, actually, you know, and)

### Planned Fix
- Upgrade to Whisper `medium` model for better disfluency preservation
- Or integrate a dedicated disfluency detection model (e.g. py-feat)
- Priority: low — core functionality unaffected