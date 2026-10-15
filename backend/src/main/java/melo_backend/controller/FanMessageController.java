package melo_backend.controller;

import melo_backend.model.FanMessage;
import melo_backend.repository.FanMessageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fan-messages")
@CrossOrigin(origins = "*")
public class FanMessageController {

    private final FanMessageRepository repository;

    public FanMessageController(FanMessageRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FanMessageRequest request) {
        String artist = clean(request.getArtist());
        String senderName = clean(request.getSenderName());
        String senderEmail = clean(request.getSenderEmail()).toLowerCase();
        String message = clean(request.getMessage());

        if (artist.isBlank() || senderName.isBlank() || senderEmail.isBlank() || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Artist, sender details and message are required."));
        }

        if (message.length() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message must be 2000 characters or fewer."));
        }

        FanMessage saved = repository.save(
                new FanMessage(artist, senderName, senderEmail, message)
        );

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/artist/{artist}")
    public ResponseEntity<?> getForArtist(@PathVariable String artist) {
        return ResponseEntity.ok(
                repository.findByArtistIgnoreCaseOrderByCreatedAtDesc(artist.trim())
        );
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(repository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        return repository.findById(id)
                .map(message -> {
                    message.setRead(true);
                    return ResponseEntity.ok(repository.save(message));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully."));
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    public static class FanMessageRequest {
        private String artist;
        private String senderName;
        private String senderEmail;
        private String message;

        public String getArtist() { return artist; }
        public void setArtist(String artist) { this.artist = artist; }
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        public String getSenderEmail() { return senderEmail; }
        public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
