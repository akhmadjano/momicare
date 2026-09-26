package com.momicare.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Stub SpeechToTextService — logs the file size and returns a fixed
 * Uzbek-language demo transcript so the frontend flow works end-to-end
 * without a real STT engine.
 *
 * Replace this bean with a real Vosk/Whisper integration when ready.
 */
@Service
@Slf4j
public class StubSpeechToTextService implements SpeechToTextService {

    @Override
    public String transcribe(MultipartFile audioFile) {
        log.info("[STT-STUB] Received audio: name={}, size={} bytes",
                audioFile.getOriginalFilename(), audioFile.getSize());
        // Demo transcript in Uzbek (as the prompt specifies)
        return "Qon bosimi 130 ga 85, yurak urishi 88, bosh og'riq bor";
    }
}
