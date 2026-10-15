package melo_backend.controller;

import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import melo_backend.model.Music;
import melo_backend.repository.MusicRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class MusicController {

    private final MusicRepository musicRepository;

    private final Path musicUploadPath =
            Paths.get("uploads/music");

    private final Path coverUploadPath =
            Paths.get("uploads/covers");


    public MusicController(
            MusicRepository musicRepository
    ) {

        this.musicRepository =
                musicRepository;


        try {

            Files.createDirectories(
                    musicUploadPath
            );

            Files.createDirectories(
                    coverUploadPath
            );

        }

        catch (IOException e) {

            throw new RuntimeException(
                    "Could not create upload directories.",
                    e
            );

        }

    }


    // ============================================================
    // UPLOAD MUSIC
    // ============================================================

    @PostMapping(
            value = "/music",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadMusic(

            @RequestParam("title")
            String title,

            @RequestParam("artist")
            String artist,

            @RequestParam("album")
            String album,

            @RequestParam("genre")
            String genre,

            @RequestParam("file")
            MultipartFile file,

            @RequestParam(
                    value = "cover",
                    required = false
            )
            MultipartFile cover

    ) {

        try {

            if (
                    file == null ||
                    file.isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Music file is required."
                        );

            }


            String originalFileName =
                    file.getOriginalFilename();


            if (
                    originalFileName == null ||
                    originalFileName.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Invalid music filename."
                        );

            }


            String musicFileName =
                    System.currentTimeMillis()
                    + "_"
                    + originalFileName;


            Path musicFilePath =
                    musicUploadPath.resolve(
                            musicFileName
                    );


            Files.copy(
                    file.getInputStream(),
                    musicFilePath
            );


            Music music =
                    new Music(
                            title,
                            artist,
                            album,
                            genre,
                            "Pending"
                    );


            music.setFileName(
                    musicFileName
            );


            music.setFilePath(
                    musicFilePath.toString()
            );


            music.setStreams(
                    0
            );


            music.setLikes(
                    0
            );


            // ----------------------------------------------------
            // COVER
            // ----------------------------------------------------

            if (
                    cover != null &&
                    !cover.isEmpty()
            ) {

                String originalCoverName =
                        cover.getOriginalFilename();


                if (
                        originalCoverName != null &&
                        !originalCoverName.trim().isEmpty()
                ) {

                    String coverFileName =
                            System.currentTimeMillis()
                            + "_"
                            + originalCoverName;


                    Path coverFilePath =
                            coverUploadPath.resolve(
                                    coverFileName
                            );


                    Files.copy(
                            cover.getInputStream(),
                            coverFilePath
                    );


                    music.setCoverFileName(
                            coverFileName
                    );


                    music.setCoverFilePath(
                            coverFilePath.toString()
                    );

                }

            }


            Music savedMusic =
                    musicRepository.save(
                            music
                    );


            return ResponseEntity
                    .status(
                            HttpStatus.CREATED
                    )
                    .body(
                            savedMusic
                    );

        }

        catch (IOException e) {

            e.printStackTrace();


            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Unable to save music files."
                    );

        }

        catch (Exception e) {

            e.printStackTrace();


            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Music upload failed."
                    );

        }

    }


    // ============================================================
    // GET ALL MUSIC
    // ============================================================

    @GetMapping("/music")
    public ResponseEntity<List<Music>> getAllMusic() {

        return ResponseEntity.ok(
                musicRepository.findAll()
        );

    }


    // ============================================================
    // UPDATE MUSIC STATUS
    // ============================================================

    @PutMapping("/music/{id}/status")
    public ResponseEntity<?> updateMusicStatus(

            @PathVariable Long id,

            @RequestParam String status

    ) {

        Optional<Music> optionalMusic =
                musicRepository.findById(
                        id
                );


        if (
                optionalMusic.isEmpty()
        ) {

            return ResponseEntity
                    .status(
                            HttpStatus.NOT_FOUND
                    )
                    .body(
                            "Music not found."
                    );

        }


        Music music =
                optionalMusic.get();


        music.setStatus(
                status
        );


        Music updatedMusic =
                musicRepository.save(
                        music
                );


        return ResponseEntity.ok(
                updatedMusic
        );

    }


    // ============================================================
    // UPDATE COVER
    // ============================================================

    @PutMapping(
            value = "/music/{id}/cover",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> updateCover(

            @PathVariable Long id,

            @RequestParam("cover")
            MultipartFile cover

    ) {

        Optional<Music> optionalMusic =
                musicRepository.findById(
                        id
                );


        if (
                optionalMusic.isEmpty()
        ) {

            return ResponseEntity
                    .status(
                            HttpStatus.NOT_FOUND
                    )
                    .body(
                            "Music not found."
                    );

        }


        if (
                cover == null ||
                cover.isEmpty()
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Cover image is required."
                    );

        }


        try {

            String originalFileName =
                    cover.getOriginalFilename();


            if (
                    originalFileName == null ||
                    originalFileName.trim().isEmpty()
            ) {

                return ResponseEntity
                        .badRequest()
                        .body(
                                "Invalid cover filename."
                        );

            }


            String coverFileName =
                    System.currentTimeMillis()
                    + "_"
                    + originalFileName;


            Path coverFilePath =
                    coverUploadPath.resolve(
                            coverFileName
                    );


            Files.copy(
                    cover.getInputStream(),
                    coverFilePath
            );


            Music music =
                    optionalMusic.get();


            music.setCoverFileName(
                    coverFileName
            );


            music.setCoverFilePath(
                    coverFilePath.toString()
            );


            Music updatedMusic =
                    musicRepository.save(
                            music
                    );


            return ResponseEntity.ok(
                    updatedMusic
            );

        }

        catch (IOException e) {

            e.printStackTrace();


            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Unable to save cover image."
                    );

        }

    }


    // ============================================================
    // GET COVER
    // ============================================================

    @GetMapping("/music/{id}/cover")
    public ResponseEntity<byte[]> getCover(
            @PathVariable Long id
    ) {

        Optional<Music> optionalMusic =
                musicRepository.findById(
                        id
                );


        if (
                optionalMusic.isEmpty()
        ) {

            return ResponseEntity
                    .notFound()
                    .build();

        }


        Music music =
                optionalMusic.get();


        if (
                music.getCoverFilePath() == null ||
                music.getCoverFilePath().isEmpty()
        ) {

            return ResponseEntity
                    .notFound()
                    .build();

        }


        try {

            Path coverPath =
                    Paths.get(
                            music.getCoverFilePath()
                    );


            if (
                    !Files.exists(
                            coverPath
                    )
            ) {

                return ResponseEntity
                        .notFound()
                        .build();

            }


            byte[] image =
                    Files.readAllBytes(
                            coverPath
                    );


            String contentType =
                    Files.probeContentType(
                            coverPath
                    );


            if (
                    contentType == null
            ) {

                contentType =
                        MediaType
                                .APPLICATION_OCTET_STREAM_VALUE;

            }


            return ResponseEntity
                    .ok()
                    .contentType(
                            MediaType.parseMediaType(
                                    contentType
                            )
                    )
                    .body(
                            image
                    );

        }

        catch (IOException e) {

            e.printStackTrace();


            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .build();

        }

    }


    // ============================================================
    // RECORD STREAM
    // ============================================================

    @PostMapping("/music/{id}/stream")
    public ResponseEntity<?> recordStream(
            @PathVariable Long id
    ) {

        Optional<Music> optionalMusic =
                musicRepository.findById(
                        id
                );


        if (
                optionalMusic.isEmpty()
        ) {

            return ResponseEntity
                    .status(
                            HttpStatus.NOT_FOUND
                    )
                    .body(
                            "Music not found."
                    );

        }


        Music music =
                optionalMusic.get();


        music.setStreams(
                music.getStreams() + 1
        );


        Music updatedMusic =
                musicRepository.save(
                        music
                );


        return ResponseEntity.ok(
                Map.of(
                        "id",
                        updatedMusic.getId(),

                        "title",
                        updatedMusic.getTitle(),

                        "streams",
                        updatedMusic.getStreams()
                )
        );

    }


    // ============================================================
    // STREAM MUSIC WITH HTTP RANGE SUPPORT
    // ============================================================

    @GetMapping("/music/{id}/stream")
    public ResponseEntity<?> streamMusic(

            @PathVariable Long id,

            @RequestHeader(
                    value = "Range",
                    required = false
            )
            String rangeHeader

    ) {

        Optional<Music> optionalMusic =
                musicRepository.findById(
                        id
                );


        if (
                optionalMusic.isEmpty()
        ) {

            return ResponseEntity
                    .notFound()
                    .build();

        }


        Music music =
                optionalMusic.get();


        if (
                music.getFilePath() == null ||
                music.getFilePath().isEmpty()
        ) {

            return ResponseEntity
                    .notFound()
                    .build();

        }


        Path musicPath =
                Paths.get(
                        music.getFilePath()
                );


        if (
                !Files.exists(
                        musicPath
                )
        ) {

            return ResponseEntity
                    .notFound()
                    .build();

        }


        try {

            long fileSize =
                    Files.size(
                            musicPath
                    );


            String contentType =
                    Files.probeContentType(
                            musicPath
                    );


            if (
                    contentType == null
            ) {

                contentType =
                        "audio/mpeg";

            }


            // ====================================================
            // NO RANGE REQUEST
            // ====================================================

            if (
                    rangeHeader == null ||
                    !rangeHeader.startsWith(
                            "bytes="
                    )
            ) {

                InputStream inputStream =
                        Files.newInputStream(
                                musicPath
                        );


                InputStreamResource resource =
                        new InputStreamResource(
                                inputStream
                        );


                HttpHeaders headers =
                        new HttpHeaders();


                headers.set(
                        HttpHeaders.ACCEPT_RANGES,
                        "bytes"
                );


                headers.setContentLength(
                        fileSize
                );


                headers.set(
                        HttpHeaders.CONTENT_TYPE,
                        contentType
                );


                return ResponseEntity
                        .ok()
                        .headers(
                                headers
                        )
                        .body(
                                resource
                        );

            }


            // ====================================================
            // RANGE REQUEST
            // ====================================================

            String range =
                    rangeHeader.substring(
                            "bytes=".length()
                    );


            String[] rangeParts =
                    range.split(
                            "-"
                    );


            long start =
                    Long.parseLong(
                            rangeParts[0]
                    );


            long end;


            if (
                    rangeParts.length > 1 &&
                    !rangeParts[1].isEmpty()
            ) {

                end =
                        Long.parseLong(
                                rangeParts[1]
                        );

            }

            else {

                end =
                        fileSize - 1;

            }


            // Prevent invalid ranges.
            if (
                    start < 0 ||
                    start >= fileSize ||
                    end < start
            ) {

                HttpHeaders headers =
                        new HttpHeaders();


                headers.set(
                        HttpHeaders.CONTENT_RANGE,
                        "bytes */" + fileSize
                );


                return ResponseEntity
                        .status(
                                HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE
                        )
                        .headers(
                                headers
                        )
                        .build();

            }


            if (
                    end >= fileSize
            ) {

                end =
                        fileSize - 1;

            }


            long contentLength =
                    end - start + 1;


            // ====================================================
            // OPEN FILE AT REQUESTED POSITION
            // ====================================================

            RandomAccessFile randomAccessFile =
                    new RandomAccessFile(
                            musicPath.toFile(),
                            "r"
                    );


            randomAccessFile.seek(
                    start
            );


            InputStream inputStream =
                    new InputStream() {

                        private long remaining =
                                contentLength;


                        @Override
                        public int read()
                                throws IOException {

                            if (
                                    remaining <= 0
                            ) {

                                return -1;

                            }


                            int value =
                                    randomAccessFile.read();


                            if (
                                    value != -1
                            ) {

                                remaining--;

                            }


                            return value;

                        }


                        @Override
                        public int read(
                                byte[] buffer,
                                int offset,
                                int length
                        )
                                throws IOException {

                            if (
                                    remaining <= 0
                            ) {

                                return -1;

                            }


                            int bytesToRead =
                                    (int)
                                            Math.min(
                                                    length,
                                                    remaining
                                            );


                            int bytesRead =
                                    randomAccessFile.read(
                                            buffer,
                                            offset,
                                            bytesToRead
                                    );


                            if (
                                    bytesRead > 0
                            ) {

                                remaining -=
                                        bytesRead;

                            }


                            return bytesRead;

                        }


                        @Override
                        public void close()
                                throws IOException {

                            randomAccessFile.close();

                        }

                    };


            InputStreamResource resource =
                    new InputStreamResource(
                            inputStream
                    );


            HttpHeaders headers =
                    new HttpHeaders();


            headers.set(
                    HttpHeaders.ACCEPT_RANGES,
                    "bytes"
            );


            headers.set(
                    HttpHeaders.CONTENT_RANGE,
                    "bytes "
                            + start
                            + "-"
                            + end
                            + "/"
                            + fileSize
            );


            headers.setContentLength(
                    contentLength
            );


            headers.set(
                    HttpHeaders.CONTENT_TYPE,
                    contentType
            );


            return ResponseEntity
                    .status(
                            HttpStatus.PARTIAL_CONTENT
                    )
                    .headers(
                            headers
                    )
                    .body(
                            resource
                    );

        }

        catch (
                NumberFormatException e
        ) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Invalid Range header."
                    );

        }

        catch (
                IOException e
        ) {

            e.printStackTrace();


            return ResponseEntity
                    .status(
                            HttpStatus.INTERNAL_SERVER_ERROR
                    )
                    .body(
                            "Unable to stream music."
                    );

        }

    }

}
