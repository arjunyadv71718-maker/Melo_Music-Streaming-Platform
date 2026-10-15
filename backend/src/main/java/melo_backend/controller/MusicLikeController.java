package melo_backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import melo_backend.model.Music;
import melo_backend.model.MusicLike;
import melo_backend.repository.MusicLikeRepository;
import melo_backend.repository.MusicRepository;

@RestController
@RequestMapping("/api/music")
@CrossOrigin(origins = "*")
public class MusicLikeController {

    private final MusicRepository musicRepository;
    private final MusicLikeRepository musicLikeRepository;

    public MusicLikeController(
            MusicRepository musicRepository,
            MusicLikeRepository musicLikeRepository
    ) {
        this.musicRepository = musicRepository;
        this.musicLikeRepository = musicLikeRepository;
    }

    @GetMapping("/{id}/like")
    public ResponseEntity<?> getLikeState(
            @PathVariable Long id,
            @RequestParam String email
    ) {
        Music music = musicRepository.findById(id).orElse(null);

        if (music == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Music not found."));
        }

        boolean liked =
                musicLikeRepository
                        .findByMusicIdAndUserEmail(
                                id,
                                email.trim().toLowerCase()
                        )
                        .isPresent();

        return ResponseEntity.ok(
                buildResponse(
                        liked,
                        musicLikeRepository.countByMusicId(id)
                )
        );
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likeMusic(
            @PathVariable Long id,
            @RequestBody LikeRequest request
    ) {
        Music music = musicRepository.findById(id).orElse(null);

        if (music == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Music not found."));
        }

        String email = cleanEmail(request.getEmail());

        if (email.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "User email is required."));
        }

        if (
                musicLikeRepository
                        .findByMusicIdAndUserEmail(id, email)
                        .isEmpty()
        ) {
            musicLikeRepository.save(
                    new MusicLike(id, email)
            );
        }

        long likes =
                musicLikeRepository.countByMusicId(id);

        music.setLikes(likes);
        musicRepository.save(music);

        return ResponseEntity.ok(
                buildResponse(true, likes)
        );
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<?> unlikeMusic(
            @PathVariable Long id,
            @RequestBody LikeRequest request
    ) {
        Music music = musicRepository.findById(id).orElse(null);

        if (music == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Music not found."));
        }

        String email = cleanEmail(request.getEmail());

        if (email.isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "User email is required."));
        }

        musicLikeRepository
                .findByMusicIdAndUserEmail(id, email)
                .ifPresent(musicLikeRepository::delete);

        long likes =
                musicLikeRepository.countByMusicId(id);

        music.setLikes(likes);
        musicRepository.save(music);

        return ResponseEntity.ok(
                buildResponse(false, likes)
        );
    }

    private Map<String, Object> buildResponse(
            boolean liked,
            long likes
    ) {
        Map<String, Object> response =
                new HashMap<>();

        response.put("liked", liked);
        response.put("likes", likes);

        return response;
    }

    private String cleanEmail(String email) {
        return email == null
                ? ""
                : email.trim().toLowerCase();
    }

    public static class LikeRequest {

        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }
}
