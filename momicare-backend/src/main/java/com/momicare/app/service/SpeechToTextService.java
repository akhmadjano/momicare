package com.momicare.app.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interface for speech-to-text transcription.
 * The stub implementation returns a placeholder transcript.
 * Replace with a real integration (Vosk + Uzbek model, Whisper, etc.)
 * by providing a different bean.
 */
public interface SpeechToTextService {
    /**
     * Transcribe the given audio file.
     * @param audioFile multipart audio upload
     * @return plain-text transcript
     */
    String transcribe(MultipartFile audioFile);
}
