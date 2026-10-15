// ============================================================
// MELO FRONTEND
// ============================================================

const API_BASE = "http://localhost:4971/api";

const HISTORY_KEY = "meloRecentlyPlayed";
const PLAYLISTS_KEY = "meloPlaylists";
const FOLLOWED_KEY = "meloFollowedArtists";
const PLAYER_STATE_KEY = "meloPlayerState";

let musicCatalog = [];
let visibleMusic = [];
let currentSongIndex = -1;
let selectedGenre = "All";


// ============================================================
// BASIC HELPERS
// ============================================================

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
}


function getFallbackCover(index = 0) {
    const covers = [
        "images/midnight.jpg",
        "images/golden.jpg",
        "images/afterglow.jpg",
        "images/lost.jpg"
    ];

    return covers[index % covers.length];
}


// ============================================================
// AUTHENTICATION
// ============================================================

function getCurrentUser() {

    if (typeof getLoggedInUser === "function") {

        try {

            const user =
                getLoggedInUser();

            if (user) {
                return user;
            }

        } catch (error) {

            console.error(
                "Auth error:",
                error
            );

        }
    }


    const raw =
        localStorage.getItem(
            "meloUser"
        );


    if (!raw) {
        return null;
    }


    try {

        return JSON.parse(
            raw
        );

    } catch {

        return null;

    }
}


function canUsePersonalFeatures() {

    const user =
        getCurrentUser();


    if (!user) {
        return false;
    }


    const role =
        String(
            user.role || ""
        ).toLowerCase();


    return (
        role === "listener" ||
        role === "artist"
    );
}


function getPersonalLibraryBlock(
    container
) {

    return container?.parentElement || null;
}


function updatePersonalLibraryVisibility() {

    const canUsePersonalLibrary =
        canUsePersonalFeatures();


    [
        "playlistList",
        "followedArtistList"
    ].forEach(
        id => {

            const container =
                document.getElementById(
                    id
                );


            const block =
                getPersonalLibraryBlock(
                    container
                );


            if (!block) {
                return;
            }


            block.hidden =
                !canUsePersonalLibrary;


            block.style.display =
                canUsePersonalLibrary
                    ? ""
                    : "none";


            block.setAttribute(
                "aria-hidden",
                String(
                    !canUsePersonalLibrary
                )
            );


            if (
                !canUsePersonalLibrary &&
                container
            ) {

                container.innerHTML =
                    "";

            }

        }
    );


    return canUsePersonalLibrary;
}


function updateAuthButton() {

    const button =
        document.getElementById(
            "authButton"
        );


    if (!button) {
        return;
    }


    const user =
        getCurrentUser();


    if (user) {

        button.textContent =
            "Logout";


        button.onclick =
            function () {

                if (
                    typeof logoutUser ===
                    "function"
                ) {

                    logoutUser();

                } else {

                    localStorage.removeItem(
                        "meloUser"
                    );

                    window.location.href =
                        "index.html";
                }

            };

    } else {

        button.textContent =
            "Sign In";


        button.onclick =
            function () {

                window.location.href =
                    "login.html";

            };
    }
}


function updateDashboardLink() {

    const link =
        document.getElementById(
            "dashboardLink"
        );


    if (!link) {
        return;
    }


    const user =
        getCurrentUser();


    if (!user) {

        link.style.display =
            "none";

        return;
    }


    const role =
        String(
            user.role || ""
        ).toLowerCase();


    if (role === "listener") {

        link.href =
            "listener.html";

    } else if (
        role === "artist"
    ) {

        link.href =
            "artist.html";

    } else if (
        role === "admin"
    ) {

        link.href =
            "admin.html";

    } else {

        link.style.display =
            "none";

        return;
    }


    link.style.display =
        "";
}


// ============================================================
// MUSIC
// ============================================================

function normalizeMusic(
    song,
    index = 0
) {

    return {

        ...song,

        title:
            song.title ||
            "Untitled",

        artist:
            song.artist ||
            "Unknown Artist",

        album:
            song.album ||
            "Single",

        genre:
            song.genre ||
            "Other",

        status:
            song.status ||
            "Approved",

        streamUrl:
            song.fileName
                ? `${API_BASE}/music/${encodeURIComponent(song.id)}/stream`
                : null,

        coverUrl:
            song.coverFileName ||
            song.coverFilePath
                ? `${API_BASE}/music/${encodeURIComponent(song.id)}/cover`
                : null,

        fallbackCover:
            getFallbackCover(
                index
            )
    };
}


function getCoverUrl(song) {

    if (
        song?.coverUrl
    ) {

        return song.coverUrl;
    }


    if (
        song?.id &&
        (
            song.coverFileName ||
            song.coverFilePath
        )
    ) {

        return `${API_BASE}/music/${encodeURIComponent(song.id)}/cover`;
    }


    return (
        song?.fallbackCover ||
        getFallbackCover()
    );
}


function findMusicById(id) {

    return musicCatalog.find(
        song =>
            String(song.id) ===
            String(id)
    );
}


async function fetchApprovedMusic() {

    const message =
        document.getElementById(
            "musicLoadMessage"
        );


    try {

        const response =
            await fetch(
                `${API_BASE}/music`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Music API returned ${response.status}`
            );

        }


        const music =
            await response.json();


        if (
            !Array.isArray(music)
        ) {

            throw new Error(
                "Invalid music response"
            );

        }


        console.log(
            "MELO - All music from backend:",
            music
        );


        musicCatalog =
            music

                .filter(
                    song =>
                        String(
                            song.status || ""
                        )
                        .trim()
                        .toLowerCase() ===
                        "approved"
                )

                .sort(
                    (a, b) =>
                        Number(
                            b.id || 0
                        ) -
                        Number(
                            a.id || 0
                        )
                )

                .map(
                    (song, index) =>
                        normalizeMusic(
                            song,
                            index
                        )
                );


        console.log(
            "MELO - Approved music catalog:",
            musicCatalog
        );


        if (message) {

            message.textContent =
                musicCatalog.length
                    ? ""
                    : "No approved music is available yet.";

        }


        return true;

    }

    catch (error) {

        console.error(
            "Unable to fetch music:",
            error
        );


        musicCatalog = [];

        visibleMusic = [];


        if (message) {

            message.textContent =
                "Unable to load music from the MELO server.";

            message.style.color =
                "#ff6b6b";
        }


        return false;
    }
}


// ============================================================
// RECENTLY PLAYED
// ============================================================

function getRecentlyPlayed() {

    try {

        const history =
            JSON.parse(
                localStorage.getItem(
                    HISTORY_KEY
                ) || "[]"
            );


        return Array.isArray(history)
            ? history
            : [];

    } catch {

        return [];

    }
}


function saveRecentlyPlayed(
    history
) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
            history
        )
    );
}


function addToRecentlyPlayed(
    song
) {

    if (
        !song ||
        !song.id
    ) {
        return;
    }


    let history =
        getRecentlyPlayed();


    history =
        history.filter(
            item =>
                String(item.id) !==
                String(song.id)
        );


    history.unshift({

        id:
            song.id,

        title:
            song.title,

        artist:
            song.artist,

        album:
            song.album,

        genre:
            song.genre,

        coverFileName:
            song.coverFileName ||
            null,

        coverFilePath:
            song.coverFilePath ||
            null
    });


    history =
        history.slice(
            0,
            10
        );


    saveRecentlyPlayed(
        history
    );


    renderHomeRecentlyPlayed();
}


function renderHomeRecentlyPlayed() {

    const container =
        document.getElementById(
            "recentlyPlayedGrid"
        ) ||
        document.getElementById(
            "recentMusic"
        );


    if (!container) {
        return;
    }


    const history =
        getRecentlyPlayed();


    if (
        history.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    padding:30px 0;
                    color:#777;
                    font-size:13px;
                "
            >
                No recently played songs yet.
            </div>

        `;

        return;
    }


    const validHistory =
        history

            .map(
                item =>
                    findMusicById(
                        item.id
                    )
            )

            .filter(
                Boolean
            );


    if (
        validHistory.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    padding:30px 0;
                    color:#777;
                    font-size:13px;
                "
            >
                No recently played songs yet.
            </div>

        `;

        return;
    }


    container.innerHTML =
        validHistory
            .map(
                (song, index) => {

                    return `

                        <article
                            class="music-card"
                        >

                            <div
                                class="album-container"
                            >

                                <div
                                    class="
                                        album-art
                                        art-${
                                            [
                                                "one",
                                                "two",
                                                "three",
                                                "four"
                                            ][
                                                index % 4
                                            ]
                                        }
                                    "
                                >

                                    <img
                                        src="${escapeHtml(
                                            getCoverUrl(
                                                song
                                            )
                                        )}"
                                        alt="${escapeHtml(
                                            song.title
                                        )}"
                                        onerror="
                                            this.onerror=null;
                                            this.src='${escapeHtml(
                                                song.fallbackCover
                                            )}';
                                        "
                                    >

                                    <button
                                        type="button"
                                        class="card-play recent-card-play"
                                        data-song-id="${escapeHtml(
                                            song.id
                                        )}"
                                    >
                                        ▶
                                    </button>

                                </div>

                            </div>


                            <h3>
                                ${escapeHtml(
                                    song.title
                                )}
                            </h3>


                            <p>
                                ${escapeHtml(
                                    song.artist
                                )}
                            </p>


                            <p>
                                ${escapeHtml(
                                    song.album
                                )}
                            </p>

                        </article>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".recent-card-play"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        const song =
                            findMusicById(
                                button.dataset.songId
                            );


                        if (song) {

                            playSong(
                                song
                            );

                        }

                    }
                );

            }
        );
}


// ============================================================
// SEARCH
// ============================================================

function getSearchValue() {

    const homeSearch =
        document.getElementById(
            "homeSearch"
        );


    const musicSearch =
        document.getElementById(
            "musicSearch"
        );


    return (
        homeSearch?.value ||
        musicSearch?.value ||
        ""
    )
        .trim()
        .toLowerCase();
}


function filterMusic() {

    const search =
        getSearchValue();


    visibleMusic =
        musicCatalog.filter(
            song => {

                const matchesSearch =
                    !search ||
                    song.title
                        .toLowerCase()
                        .includes(search) ||
                    song.artist
                        .toLowerCase()
                        .includes(search) ||
                    song.album
                        .toLowerCase()
                        .includes(search) ||
                    song.genre
                        .toLowerCase()
                        .includes(search);


                const matchesGenre =
                    selectedGenre ===
                        "All" ||
                    song.genre
                        .toLowerCase() ===
                        selectedGenre
                            .toLowerCase();


                return (
                    matchesSearch &&
                    matchesGenre
                );

            }
        );


    renderMusicCards();

    renderArtists();

    renderHomeRecentlyPlayed();

    renderPlaylists();

    renderFollowedArtists();
}


function setupSearchInputs() {

    const inputs = [

        document.getElementById(
            "homeSearch"
        ),

        document.getElementById(
            "musicSearch"
        )

    ].filter(
        Boolean
    );


    inputs.forEach(
        input => {

            input.addEventListener(
                "input",
                function () {

                    inputs.forEach(
                        other => {

                            if (
                                other !==
                                input
                            ) {

                                other.value =
                                    input.value;

                            }

                        }
                    );


                    filterMusic();

                }
            );

        }
    );
}


// ============================================================
// GENRE FILTER
// ============================================================

function setupGenreButtons() {

    const container =
        document.getElementById(
            "genreContainer"
        );


    if (!container) {
        return;
    }


    const genres = [

        "All",

        ...Array.from(
            new Set(
                musicCatalog
                    .map(
                        song =>
                            song.genre
                    )
                    .filter(
                        Boolean
                    )
            )
        ).sort()

    ];


    container.innerHTML =
        genres
            .map(
                genre => `

                    <button
                        type="button"
                        class="genre ${
                            genre ===
                            selectedGenre
                                ? "active"
                                : ""
                        }"
                        data-genre="${escapeHtml(
                            genre
                        )}"
                    >
                        ${escapeHtml(
                            genre
                        )}
                    </button>

                `
            )
            .join("");


    container
        .querySelectorAll(
            ".genre"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        selectedGenre =
                            button.dataset
                                .genre ||
                            "All";


                        container
                            .querySelectorAll(
                                ".genre"
                            )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item ===
                                            button
                                    );

                                }
                            );


                        filterMusic();

                    }
                );

            }
        );
}


// ============================================================
// FOLLOW SYSTEM
// ============================================================

function getFollowedArtists() {

    if (
        !canUsePersonalFeatures()
    ) {
        return [];
    }


    try {

        const artists =
            JSON.parse(
                localStorage.getItem(
                    FOLLOWED_KEY
                ) || "[]"
            );


        return Array.isArray(
            artists
        )
            ? artists
            : [];

    } catch {

        return [];

    }
}


function saveFollowedArtists(
    artists
) {

    localStorage.setItem(
        FOLLOWED_KEY,
        JSON.stringify(
            artists
        )
    );
}


function isFollowing(
    artistName
) {

    return getFollowedArtists()
        .some(
            artist =>
                String(
                    artist
                )
                    .trim()
                    .toLowerCase() ===
                String(
                    artistName
                )
                    .trim()
                    .toLowerCase()
        );
}


function followArtist(
    artistName
) {

    if (
        !canUsePersonalFeatures()
    ) {

        alert(
            "Please sign in as a listener or artist first."
        );

        return;
    }


    const cleanArtistName =
        String(
            artistName || ""
        ).trim();


    if (!cleanArtistName) {
        return;
    }


    if (
        isFollowing(
            cleanArtistName
        )
    ) {

        return;
    }


    const artists =
        getFollowedArtists();


    artists.push(
        cleanArtistName
    );


    saveFollowedArtists(
        artists
    );


    console.log(
        "MELO - Followed artists:",
        getFollowedArtists()
    );


    renderMusicCards();

    renderArtists();

    renderFollowedArtists();


    showToast(
        `Following ${cleanArtistName}`
    );
}


function unfollowArtist(
    artistName
) {

    if (
        !canUsePersonalFeatures()
    ) {
        return;
    }


    const target =
        String(
            artistName || ""
        )
            .trim()
            .toLowerCase();


    const updatedArtists =
        getFollowedArtists()
            .filter(
                artist =>
                    String(
                        artist
                    )
                        .trim()
                        .toLowerCase() !==
                    target
            );


    saveFollowedArtists(
        updatedArtists
    );


    renderMusicCards();

    renderArtists();

    renderFollowedArtists();


    showToast(
        `Unfollowed ${artistName}`
    );
}


// ============================================================
// FOLLOWED ARTISTS LIBRARY
// ============================================================

function renderFollowedArtists() {

    const container =
        document.getElementById(
            "followedArtistList"
        );


    if (!container) {
        return;
    }


    if (
        !updatePersonalLibraryVisibility()
    ) {

        return;
    }


    const followed =
        getFollowedArtists();


    if (
        followed.length === 0
    ) {

        container.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    padding:25px 0;
                    color:#777;
                    font-size:13px;
                "
            >
                You are not following any artists yet.
            </div>

        `;

        return;
    }


    /*
       IMPORTANT FIX:

       Followed artists are now resolved from
       the COMPLETE musicCatalog.

       They no longer depend on search or
       genre filtering.
    */

    const artistData =
        followed.map(
            artistName => {

                const songs =
                    musicCatalog.filter(
                        song =>

                            String(
                                song.artist
                            )
                                .trim()
                                .toLowerCase() ===

                            String(
                                artistName
                            )
                                .trim()
                                .toLowerCase()
                    );


                const firstSong =
                    songs[0] ||
                    null;


                return {

                    name:
                        artistName,

                    songs,

                    cover:
                        firstSong
                            ? getCoverUrl(
                                firstSong
                            )
                            : getFallbackCover()

                };

            }
        );


    container.innerHTML =
        artistData
            .map(
                artist => `

                    <div
                        class="artist-card"
                        style="
                            position:relative;
                        "
                    >

                        <div
                            class="artist-avatar"
                            style="
                                overflow:hidden;
                            "
                        >

                            <img
                                src="${escapeHtml(
                                    artist.cover
                                )}"
                                alt="${escapeHtml(
                                    artist.name
                                )}"
                                style="
                                    width:100%;
                                    height:100%;
                                    object-fit:cover;
                                    border-radius:50%;
                                "
                                onerror="
                                    this.onerror=null;
                                    this.style.display='none';
                                    this.parentElement.textContent='${escapeHtml(
                                        artist.name
                                            .charAt(0)
                                            .toUpperCase()
                                    )}';
                                "
                            >

                        </div>


                        <h3>
                            ${escapeHtml(
                                artist.name
                            )}
                        </h3>


                        <p>
                            ${artist.songs.length}
                            ${
                                artist.songs.length ===
                                1
                                    ? "song"
                                    : "songs"
                            }
                        </p>


                        <button
                            type="button"
                            class="melo-unfollow"
                            data-artist="${escapeHtml(
                                artist.name
                            )}"
                            style="
                                margin-top:12px;
                                border:1px solid
                                    rgba(255,255,255,.12);
                                border-radius:18px;
                                padding:8px 13px;
                                background:
                                    rgba(255,255,255,.04);
                                color:white;
                                font-size:11px;
                                cursor:pointer;
                            "
                        >
                            Unfollow
                        </button>

                    </div>

                `
            )
            .join("");


    container
        .querySelectorAll(
            ".melo-unfollow"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        unfollowArtist(
                            button.dataset
                                .artist
                        );

                    }
                );

            }
        );
}


// ============================================================
// PLAYLIST STORAGE
// ============================================================

function normalizePlaylists() {

    if (
        !canUsePersonalFeatures()
    ) {

        return [];
    }


    let playlists = [];


    try {

        const stored =
            JSON.parse(
                localStorage.getItem(
                    PLAYLISTS_KEY
                ) || "[]"
            );


        playlists =
            Array.isArray(
                stored
            )
                ? stored
                : [];

    } catch {

        playlists = [];

    }


    let changed =
        false;


    playlists =
        playlists.map(
            (
                playlist,
                index
            ) => {

                if (
                    !playlist ||
                    typeof playlist !==
                        "object"
                ) {

                    changed =
                        true;


                    return {

                        id:
                            Date.now() +
                            index,

                        name:
                            `My Playlist ${
                                index + 1
                            }`,

                        songs:
                            []
                    };
                }


                if (
                    !playlist.name ||
                    !String(
                        playlist.name
                    ).trim()
                ) {

                    playlist.name =
                        `My Playlist ${
                            index + 1
                        }`;

                    changed =
                        true;
                }


                if (
                    !Array.isArray(
                        playlist.songs
                    )
                ) {

                    playlist.songs =
                        [];

                    changed =
                        true;
                }


                return playlist;

            }
        );


    if (changed) {

        localStorage.setItem(
            PLAYLISTS_KEY,
            JSON.stringify(
                playlists
            )
        );

    }


    return playlists;
}


function getPlaylists() {

    return normalizePlaylists();
}


function savePlaylists(
    playlists
) {

    localStorage.setItem(
        PLAYLISTS_KEY,
        JSON.stringify(
            playlists
        )
    );
}


// ============================================================
// PLAYLIST RENDERING
// ============================================================

function renderPlaylists() {

    const container =
        document.getElementById(
            "playlistList"
        );


    if (!container) {
        return;
    }


    if (
        !updatePersonalLibraryVisibility()
    ) {

        return;
    }


    const playlists =
        getPlaylists();


    if (
        playlists.length ===
        0
    ) {

        container.innerHTML = `

            <div
                style="
                    padding:25px 0;
                    color:#777;
                    font-size:13px;
                "
            >
                No playlists yet.
                Create your first playlist.
            </div>

        `;

        return;
    }


    container.innerHTML =
        playlists
            .map(
                playlist => {

                    const songs =
                        Array.isArray(
                            playlist.songs
                        )
                            ? playlist.songs
                            : [];


                    return `

                        <div
                            class="melo-playlist-card"
                            style="
                                padding:18px;
                                margin-bottom:14px;
                                border:
                                    1px solid
                                    rgba(255,255,255,.08);
                                border-radius:18px;
                                background:
                                    rgba(255,255,255,.035);
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:space-between;
                                    align-items:center;
                                    gap:15px;
                                    margin-bottom:14px;
                                "
                            >

                                <div>

                                    <h3
                                        style="
                                            margin:0;
                                            color:white;
                                            font-size:16px;
                                        "
                                    >
                                        ${escapeHtml(
                                            playlist.name
                                        )}
                                    </h3>

                                    <p
                                        style="
                                            margin:5px 0 0;
                                            color:#777;
                                            font-size:11px;
                                        "
                                    >
                                        ${
                                            songs.length
                                        }
                                        ${
                                            songs.length ===
                                            1
                                                ? "song"
                                                : "songs"
                                        }
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    class="melo-delete-playlist"
                                    data-playlist-id="${escapeHtml(
                                        playlist.id
                                    )}"
                                    style="
                                        border:none;
                                        border-radius:14px;
                                        padding:7px 10px;
                                        background:
                                            rgba(255,55,95,.10);
                                        color:#ff6b88;
                                        font-size:11px;
                                        cursor:pointer;
                                    "
                                >
                                    Delete
                                </button>

                            </div>


                            ${
                                songs.length

                                    ? songs
                                        .map(
                                            (
                                                playlistSong,
                                                songIndex
                                            ) => {

                                                const actualSong =
                                                    findMusicById(
                                                        playlistSong.id
                                                    );


                                                const cover =
                                                    actualSong
                                                        ? getCoverUrl(
                                                            actualSong
                                                        )
                                                        : getFallbackCover(
                                                            songIndex
                                                        );


                                                return `

                                                    <div
                                                        class="melo-playlist-song"
                                                        style="
                                                            display:flex;
                                                            align-items:center;
                                                            gap:10px;
                                                            padding:8px 0;
                                                            border-top:
                                                                1px solid
                                                                rgba(255,255,255,.05);
                                                        "
                                                    >

                                                        <img
                                                            src="${escapeHtml(
                                                                cover
                                                            )}"
                                                            alt=""
                                                            style="
                                                                width:42px;
                                                                height:42px;
                                                                object-fit:cover;
                                                                border-radius:9px;
                                                            "
                                                        >


                                                        <div
                                                            style="
                                                                flex:1;
                                                                min-width:0;
                                                            "
                                                        >

                                                            <strong
                                                                style="
                                                                    display:block;
                                                                    color:white;
                                                                    font-size:12px;
                                                                    white-space:nowrap;
                                                                    overflow:hidden;
                                                                    text-overflow:ellipsis;
                                                                "
                                                            >
                                                                ${escapeHtml(
                                                                    playlistSong.title ||
                                                                    "Untitled"
                                                                )}
                                                            </strong>


                                                            <span
                                                                style="
                                                                    display:block;
                                                                    margin-top:3px;
                                                                    color:#777;
                                                                    font-size:10px;
                                                                "
                                                            >
                                                                ${escapeHtml(
                                                                    playlistSong.artist ||
                                                                    "Unknown Artist"
                                                                )}
                                                            </span>

                                                        </div>


                                                        <button
                                                            type="button"
                                                            class="melo-playlist-play"
                                                            data-song-id="${escapeHtml(
                                                                playlistSong.id
                                                            )}"
                                                            style="
                                                                width:34px;
                                                                height:34px;
                                                                border:none;
                                                                border-radius:50%;
                                                                background:white;
                                                                color:#111;
                                                                cursor:pointer;
                                                                flex-shrink:0;
                                                            "
                                                        >
                                                            ▶
                                                        </button>

                                                    </div>

                                                `;

                                            }
                                        )
                                        .join("")

                                    : `

                                        <div
                                            style="
                                                padding:8px 0;
                                                color:#666;
                                                font-size:11px;
                                            "
                                        >
                                            This playlist is empty.
                                        </div>

                                    `
                            }

                        </div>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".melo-delete-playlist"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        deletePlaylist(
                            button.dataset
                                .playlistId
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            ".melo-playlist-play"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        const song =
                            findMusicById(
                                button.dataset
                                    .songId
                            );


                        if (song) {

                            playSong(
                                song
                            );

                        } else {

                            showToast(
                                "This song is no longer available."
                            );

                        }

                    }
                );

            }
        );
}


function deletePlaylist(
    playlistId
) {

    const playlists =
        getPlaylists();


    const playlist =
        playlists.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    playlistId
                )
        );


    if (!playlist) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete playlist "${playlist.name}"?`
        );


    if (!confirmed) {
        return;
    }


    const updated =
        playlists.filter(
            item =>
                String(
                    item.id
                ) !==
                String(
                    playlistId
                )
        );


    savePlaylists(
        updated
    );


    renderPlaylists();


    showToast(
        `"${playlist.name}" deleted.`
    );
}


function createEmptyPlaylist() {

    if (
        !canUsePersonalFeatures()
    ) {

        alert(
            "Please sign in first."
        );

        return;
    }


    const name =
        window.prompt(
            "Enter playlist name:"
        );


    if (
        !name ||
        !name.trim()
    ) {

        return;
    }


    const playlists =
        getPlaylists();


    const playlist = {

        id:
            Date.now(),

        name:
            name.trim(),

        songs:
            []
    };


    playlists.push(
        playlist
    );


    savePlaylists(
        playlists
    );


    renderPlaylists();


    showToast(
        `"${playlist.name}" created.`
    );
}


function setupCreatePlaylistButton() {

    const button =
        document.getElementById(
            "createPlaylistButton"
        );


    if (!button) {
        return;
    }


    if (
        button.dataset
            .meloReady ===
        "true"
    ) {

        return;
    }


    button.dataset
        .meloReady =
        "true";


    button.addEventListener(
        "click",
        function () {

            createEmptyPlaylist();

        }
    );
}


// ============================================================
// PLAYLIST MODAL
// ============================================================

function closePlaylistModal() {

    const modal =
        document.getElementById(
            "meloPlaylistModal"
        );


    if (modal) {

        modal.remove();

    }
}


function showToast(
    message
) {

    const existing =
        document.getElementById(
            "meloToast"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.id =
        "meloToast";


    toast.textContent =
        message;


    toast.style.cssText = `

        position:fixed;

        left:50%;

        bottom:110px;

        transform:translateX(-50%);

        z-index:10000;

        padding:11px 18px;

        border-radius:20px;

        background:white;

        color:#111;

        font-size:12px;

        font-weight:600;

        box-shadow:0 15px 50px rgba(0,0,0,.5);

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(
        function () {

            if (
                toast.parentNode
            ) {

                toast.remove();

            }

        },
        2200
    );
}


function addSongToPlaylist(
    song,
    playlistId
) {

    const playlists =
        getPlaylists();


    const playlist =
        playlists.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    playlistId
                )
        );


    if (!playlist) {

        showToast(
            "Playlist not found."
        );

        return;
    }


    if (
        playlist.songs.some(
            existing =>
                String(
                    existing.id
                ) ===
                String(
                    song.id
                )
        )
    ) {

        showToast(
            `"${song.title}" is already in "${playlist.name}".`
        );


        closePlaylistModal();


        return;
    }


    playlist.songs.push({

        id:
            song.id,

        title:
            song.title,

        artist:
            song.artist,

        album:
            song.album,

        genre:
            song.genre,

        coverFileName:
            song.coverFileName ||
            null

    });


    savePlaylists(
        playlists
    );


    closePlaylistModal();


    renderPlaylists();


    showToast(
        `"${song.title}" added to "${playlist.name}".`
    );
}


function createPlaylistFromSong(
    song
) {

    const input =
        document.getElementById(
            "meloNewPlaylistName"
        );


    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (!name) {

        input.focus();

        return;
    }


    const playlists =
        getPlaylists();


    const playlist = {

        id:
            Date.now(),

        name,

        songs: [

            {

                id:
                    song.id,

                title:
                    song.title,

                artist:
                    song.artist,

                album:
                    song.album,

                genre:
                    song.genre,

                coverFileName:
                    song.coverFileName ||
                    null

            }

        ]

    };


    playlists.push(
        playlist
    );


    savePlaylists(
        playlists
    );


    closePlaylistModal();


    renderPlaylists();


    showToast(
        `"${song.title}" added to "${playlist.name}".`
    );
}


function openPlaylistSelector(
    song
) {

    if (
        !canUsePersonalFeatures()
    ) {

        alert(
            "Please sign in first."
        );

        return;
    }


    closePlaylistModal();


    const playlists =
        getPlaylists();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "meloPlaylistModal";


    modal.innerHTML = `

        <div
            style="
                position:fixed;
                inset:0;
                z-index:9999;
                background:rgba(0,0,0,.72);
                backdrop-filter:blur(10px);
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
            "
        >

            <div
                style="
                    width:100%;
                    max-width:430px;
                    background:#151515;
                    border:1px solid rgba(255,255,255,.10);
                    border-radius:22px;
                    padding:24px;
                    box-shadow:0 30px 100px rgba(0,0,0,.6);
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        gap:15px;
                    "
                >

                    <div>

                        <p
                            style="
                                margin:0 0 5px;
                                color:#ff375f;
                                font-size:10px;
                                font-weight:700;
                                letter-spacing:2px;
                            "
                        >
                            PLAYLISTS
                        </p>


                        <h2
                            style="
                                margin:0;
                                color:white;
                                font-size:22px;
                            "
                        >
                            Add to Playlist
                        </h2>

                    </div>


                    <button
                        id="meloClosePlaylistModal"
                        type="button"
                        style="
                            width:34px;
                            height:34px;
                            border-radius:50%;
                            border:1px solid rgba(255,255,255,.10);
                            background:rgba(255,255,255,.05);
                            color:white;
                            cursor:pointer;
                            font-size:18px;
                        "
                    >
                        ×
                    </button>

                </div>


                <p
                    style="
                        margin:8px 0 20px;
                        color:#888;
                        font-size:12px;
                    "
                >
                    ${escapeHtml(
                        song.title
                    )}
                    —
                    ${escapeHtml(
                        song.artist
                    )}
                </p>


                <div
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:9px;
                    "
                >

                    ${
                        playlists.length

                            ? playlists
                                .map(
                                    playlist => `

                                        <button
                                            type="button"
                                            class="melo-playlist-choice"
                                            data-playlist-id="${escapeHtml(
                                                playlist.id
                                            )}"
                                            style="
                                                display:flex;
                                                justify-content:space-between;
                                                align-items:center;
                                                width:100%;
                                                border:1px solid rgba(255,255,255,.08);
                                                border-radius:14px;
                                                padding:13px 15px;
                                                background:rgba(255,255,255,.035);
                                                color:white;
                                                cursor:pointer;
                                                text-align:left;
                                            "
                                        >

                                            <span>

                                                <strong>
                                                    ${escapeHtml(
                                                        playlist.name
                                                    )}
                                                </strong>


                                                <span
                                                    style="
                                                        display:block;
                                                        margin-top:3px;
                                                        color:#777;
                                                        font-size:10px;
                                                    "
                                                >
                                                    ${
                                                        playlist.songs.length
                                                    }
                                                    ${
                                                        playlist.songs.length ===
                                                        1
                                                            ? "song"
                                                            : "songs"
                                                    }
                                                </span>

                                            </span>


                                            <span
                                                style="
                                                    color:#777;
                                                    font-size:12px;
                                                "
                                            >
                                                →
                                            </span>

                                        </button>

                                    `
                                )
                                .join("")

                            : `

                                <div
                                    style="
                                        padding:10px 0;
                                        color:#777;
                                        font-size:12px;
                                    "
                                >
                                    No playlists yet.
                                </div>

                            `
                    }


                    <div
                        style="
                            margin-top:12px;
                            padding-top:18px;
                            border-top:1px solid rgba(255,255,255,.07);
                        "
                    >

                        <p
                            style="
                                margin:0 0 8px;
                                color:#aaa;
                                font-size:11px;
                            "
                        >
                            Create new playlist
                        </p>


                        <div
                            style="
                                display:flex;
                                gap:8px;
                            "
                        >

                            <input
                                id="meloNewPlaylistName"
                                type="text"
                                placeholder="Playlist name"
                                style="
                                    flex:1;
                                    min-width:0;
                                    border:1px solid rgba(255,255,255,.10);
                                    border-radius:13px;
                                    padding:11px;
                                    background:#0d0d0d;
                                    color:white;
                                    outline:none;
                                "
                            >


                            <button
                                id="meloCreatePlaylistButton"
                                type="button"
                                style="
                                    border:none;
                                    border-radius:13px;
                                    padding:0 14px;
                                    background:white;
                                    color:#111;
                                    font-weight:600;
                                    cursor:pointer;
                                "
                            >
                                Create
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "meloClosePlaylistModal"
        )
        .addEventListener(
            "click",
            closePlaylistModal
        );


    modal
        .querySelectorAll(
            ".melo-playlist-choice"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        addSongToPlaylist(
                            song,
                            button.dataset
                                .playlistId
                        );

                    }
                );

            }
        );


    document
        .getElementById(
            "meloCreatePlaylistButton"
        )
        .addEventListener(
            "click",
            function () {

                createPlaylistFromSong(
                    song
                );

            }
        );


    const input =
        document.getElementById(
            "meloNewPlaylistName"
        );


    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    createPlaylistFromSong(
                        song
                    );

                }

            }
        );


        input.focus();

    }
}


// ============================================================
// MUSIC CARDS
// ============================================================

function renderMusicCards() {

    const grids = [

        document.getElementById(
            "homeMusicGrid"
        ),

        document.getElementById(
            "browseMusicGrid"
        )

    ].filter(
        Boolean
    );


    if (
        grids.length ===
        0
    ) {

        return;
    }


    grids.forEach(
        grid => {

            if (
                visibleMusic.length ===
                0
            ) {

                grid.innerHTML = `

                    <div
                        style="
                            grid-column:1/-1;
                            padding:30px;
                            color:#888;
                        "
                    >
                        No approved music found.
                    </div>

                `;

                return;
            }


            grid.innerHTML =
                visibleMusic
                    .map(
                        (
                            song,
                            index
                        ) => {

                            let personalHTML =
                                "";


                            if (
                                canUsePersonalFeatures()
                            ) {

                                personalHTML = `

                                    <div
                                        style="
                                            display:flex;
                                            gap:8px;
                                            margin-top:13px;
                                            flex-wrap:wrap;
                                        "
                                    >

                                        <button
                                            type="button"
                                            class="melo-add-playlist"
                                            data-song-id="${escapeHtml(
                                                song.id
                                            )}"
                                            style="
                                                border:none;
                                                border-radius:18px;
                                                padding:8px 13px;
                                                background:white;
                                                color:#111;
                                                font-size:11px;
                                                font-weight:600;
                                                cursor:pointer;
                                            "
                                        >
                                            Add to Playlist
                                        </button>


                                        ${
                                            isFollowing(
                                                song.artist
                                            )

                                                ? ""

                                                : `

                                                    <button
                                                        type="button"
                                                        class="melo-follow"
                                                        data-artist="${escapeHtml(
                                                            song.artist
                                                        )}"
                                                        style="
                                                            border:1px solid rgba(255,255,255,.12);
                                                            border-radius:18px;
                                                            padding:8px 13px;
                                                            background:rgba(255,255,255,.04);
                                                            color:white;
                                                            font-size:11px;
                                                            cursor:pointer;
                                                        "
                                                    >
                                                        Follow
                                                    </button>

                                                `
                                        }

                                    </div>

                                `;

                            }


                            return `

                                <article
                                    class="music-card"
                                >

                                    <div
                                        class="album-container"
                                    >

                                        <div
                                            class="
                                                album-art
                                                art-${
                                                    [
                                                        "one",
                                                        "two",
                                                        "three",
                                                        "four"
                                                    ][
                                                        index % 4
                                                    ]
                                                }
                                            "
                                        >

                                            <img
                                                src="${escapeHtml(
                                                    getCoverUrl(
                                                        song
                                                    )
                                                )}"
                                                alt="${escapeHtml(
                                                    song.title
                                                )}"
                                                onerror="
                                                    this.onerror=null;
                                                    this.src='${escapeHtml(
                                                        song.fallbackCover
                                                    )}';
                                                "
                                            >


                                            <button
                                                class="card-play"
                                                type="button"
                                                data-song-index="${index}"
                                                ${
                                                    song.streamUrl
                                                        ? ""
                                                        : "disabled"
                                                }
                                            >
                                                ▶
                                            </button>

                                        </div>

                                    </div>


                                    <h3>
                                        ${escapeHtml(
                                            song.title
                                        )}
                                    </h3>


                                    <p>
                                        ${escapeHtml(
                                            song.artist
                                        )}
                                    </p>


                                    <p>
                                        ${escapeHtml(
                                            song.album
                                        )}
                                    </p>


                                    ${personalHTML}

                                </article>

                            `;

                        }
                    )
                    .join("");


            addLikeButtonsToMusicCards();

            grid
                .querySelectorAll(
                    ".melo-add-playlist"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            function (event) {

                                event.stopPropagation();


                                const song =
                                    findMusicById(
                                        button.dataset
                                            .songId
                                    );


                                if (song) {

                                    openPlaylistSelector(
                                        song
                                    );

                                }

                            }
                        );

                    }
                );


            grid
                .querySelectorAll(
                    ".melo-follow"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            function (event) {

                                event.stopPropagation();


                                followArtist(
                                    button.dataset
                                        .artist
                                );

                            }
                        );

                    }
                );

        }
    );
}


// ============================================================
// ARTISTS
// ============================================================

function renderArtists() {

    const homeArtistList =
        document.getElementById(
            "homeArtistList"
        );


    const artistGrid =
        document.getElementById(
            "artistGrid"
        );


    /*
       IMPORTANT FIX:

       Artist Directory uses musicCatalog,
       not visibleMusic.

       Therefore search and genre filters
       cannot accidentally remove an artist
       from the Artist Directory.
    */

    const artistMap =
        new Map();


    musicCatalog.forEach(
        song => {

            const artist =
                String(
                    song.artist ||
                    "Unknown Artist"
                ).trim();


            if (!artist) {
                return;
            }


            const key =
                artist
                    .toLowerCase();


            if (
                !artistMap.has(
                    key
                )
            ) {

                artistMap.set(
                    key,
                    {
                        name:
                            artist,

                        count:
                            0
                    }
                );

            }


            artistMap
                .get(key)
                .count++;

        }
    );


    const artists =
        Array.from(
            artistMap.values()
        );


    console.log(
        "MELO - Artists:",
        artists
    );


    function card(
        artist
    ) {

        const canFollow =
            canUsePersonalFeatures() &&
            !isFollowing(
                artist.name
            );


        return `

            <div
                class="artist-card"
            >

                <div
                    class="artist-avatar"
                >
                    ${escapeHtml(
                        artist.name
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>


                <h3>
                    ${escapeHtml(
                        artist.name
                    )}
                </h3>


                <p>
                    ${artist.count}
                    ${
                        artist.count ===
                        1
                            ? "song"
                            : "songs"
                    }
                </p>


                ${
                    canFollow

                        ? `

                            <button
                                type="button"
                                class="melo-artist-follow"
                                data-artist="${escapeHtml(
                                    artist.name
                                )}"
                                style="
                                    margin-top:12px;
                                    border:1px solid rgba(255,255,255,.12);
                                    border-radius:18px;
                                    padding:8px 13px;
                                    background:rgba(255,255,255,.04);
                                    color:white;
                                    cursor:pointer;
                                "
                            >
                                Follow
                            </button>

                        `

                        : ""
                }

            </div>

        `;

    }


    if (
        homeArtistList
    ) {

        homeArtistList.innerHTML =
            artists
                .slice(
                    0,
                    4
                )
                .map(
                    card
                )
                .join("");

    }


    if (
        artistGrid
    ) {

        artistGrid.innerHTML =
            artists
                .map(
                    card
                )
                .join("");

    }


    document
        .querySelectorAll(
            ".melo-artist-follow"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function () {

                        followArtist(
                            button.dataset
                                .artist
                        );

                    }
                );

            }
        );
}



// ============================================================
// LIKE SYSTEM
// ============================================================

function syncLikeButtonsForSong(songId, liked, likes) {

    document
        .querySelectorAll(".melo-like-button")
        .forEach(button => {
            if (String(button.dataset.songId) !== String(songId)) {
                return;
            }

            button.dataset.liked = liked ? "true" : "false";
            button.textContent = liked
                ? `♥ ${Number(likes || 0)}`
                : `♡ ${Number(likes || 0)}`;
            button.setAttribute(
                "aria-label",
                liked ? "Unlike this song" : "Like this song"
            );
        });
}


async function refreshLikeButtonsFromServer() {

    const user = getCurrentUser();
    if (!user || !user.email) return;

    const buttons = Array.from(
        document.querySelectorAll(".melo-like-button")
    );

    await Promise.all(
        buttons.map(button =>
            loadLikeState(button.dataset.songId, button)
        )
    );
}


async function toggleMusicLike(songId, button) {
    const user = getCurrentUser();

    if (!user || !user.email) {
        alert("Please sign in to like music.");
        return;
    }

    if (!songId) {
        return;
    }

    const currentlyLiked = button?.dataset.liked === "true";

    try {
        const response = await fetch(
            `${API_BASE}/music/${encodeURIComponent(songId)}/like`,
            {
                method: currentlyLiked ? "DELETE" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: user.email
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to update like."
            );
        }

        const song = findMusicById(songId);

        if (song) {
            song.likes = Number(result.likes || 0);
        }

        if (button) {
            button.dataset.liked =
                result.liked ? "true" : "false";

            button.textContent =
                result.liked
                    ? `♥ ${result.likes || 0}`
                    : `♡ ${result.likes || 0}`;

            button.setAttribute(
                "aria-label",
                result.liked
                    ? "Unlike this song"
                    : "Like this song"
            );
        }

        syncLikeButtonsForSong(
            songId,
            Boolean(result.liked),
            Number(result.likes || 0)
        );

        try {
            localStorage.setItem(
                "meloLikeSync",
                JSON.stringify({
                    songId: String(songId),
                    liked: Boolean(result.liked),
                    likes: Number(result.likes || 0),
                    timestamp: Date.now()
                })
            );
        } catch {
            // Ignore localStorage sync errors.
        }

        showToast(
            result.liked
                ? "Added to liked music"
                : "Removed from liked music"
        );
    }
    catch (error) {
        console.error(
            "MELO - Like request failed:",
            error
        );

        alert(
            "Unable to update like right now."
        );
    }
}


async function loadLikeState(songId, button) {
    const user = getCurrentUser();

    if (!user || !user.email || !songId || !button) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/music/${encodeURIComponent(songId)}/like?email=${encodeURIComponent(user.email)}`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            return;
        }

        const result = await response.json();

        button.dataset.liked =
            result.liked ? "true" : "false";

        button.textContent =
            result.liked
                ? `♥ ${result.likes || 0}`
                : `♡ ${result.likes || 0}`;

        button.setAttribute(
            "aria-label",
            result.liked
                ? "Unlike this song"
                : "Like this song"
        );
    }
    catch (error) {
        console.warn(
            "MELO - Could not load like state:",
            error
        );
    }
}


function addLikeButtonsToMusicCards() {
    const cards =
        document.querySelectorAll(
            ".music-card"
        );

    cards.forEach(card => {
        if (
            card.querySelector(
                ".melo-like-button"
            )
        ) {
            return;
        }

        const playButton =
            card.querySelector(
                ".card-play"
            );

        if (!playButton) {
            return;
        }

        const songIndex =
            Number(
                playButton.dataset.songIndex
            );

        if (
            !Number.isFinite(songIndex) ||
            !visibleMusic[songIndex]
        ) {
            return;
        }

        const song =
            visibleMusic[songIndex];

        const wrapper =
            document.createElement("div");

        wrapper.style.cssText =
            "display:flex;gap:8px;margin-top:10px;";

        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "melo-like-button";

        button.dataset.songId =
            String(song.id);

        button.dataset.liked =
            "false";

        button.textContent =
            `♡ ${Number(song.likes || 0)}`;

        button.style.cssText =
            "border:1px solid rgba(255,255,255,.12);" +
            "border-radius:18px;" +
            "padding:8px 13px;" +
            "background:rgba(255,255,255,.04);" +
            "color:white;" +
            "font-size:11px;" +
            "cursor:pointer;";

        button.addEventListener(
            "click",
            function (event) {
                event.preventDefault();
                event.stopPropagation();

                toggleMusicLike(
                    song.id,
                    button
                );
            }
        );

        wrapper.appendChild(button);

        const personalBlock =
            card.querySelector(
                "[style*='margin-top:13px']"
            );

        if (personalBlock) {
            personalBlock.before(wrapper);
        }
        else {
            card.appendChild(wrapper);
        }

        loadLikeState(
            song.id,
            button
        );
    });
}


// ============================================================
// PLAYER
// ============================================================


function getPlayer() {

    return {

        audio:
            document.getElementById(
                "audioPlayer"
            ),

        title:
            document.getElementById(
                "songTitle"
            ),

        artist:
            document.getElementById(
                "songArtist"
            ),

        miniArt:
            document.getElementById(
                "miniArt"
            ),

        play:
            document.getElementById(
                "playButton"
            ),

        previous:
            document.getElementById(
                "prevButton"
            ),

        next:
            document.getElementById(
                "nextButton"
            ),

        progress:
            document.getElementById(
                "progressBar"
            ),

        currentTime:
            document.getElementById(
                "currentTime"
            ),

        duration:
            document.getElementById(
                "duration"
            ),

        volume:
            document.getElementById(
                "volumeBar"
            )

    };
}


async function playSong(
    song
) {

    const player =
        getPlayer();


    if (
        !player.audio ||
        !song ||
        !song.streamUrl
    ) {

        return;
    }


    const index =
        visibleMusic.findIndex(
            item =>
                String(
                    item.id
                ) ===
                String(
                    song.id
                )
        );


    if (
        index >= 0
    ) {

        currentSongIndex =
            index;

    }


    addToRecentlyPlayed(
        song
    );


    if (
        player.title
    ) {

        player.title.textContent =
            song.title;

    }


    if (
        player.artist
    ) {

        player.artist.textContent =
            song.artist;

    }


    if (
        player.miniArt
    ) {

        player.miniArt.style.backgroundImage =
            `url("${getCoverUrl(
                song
            )}")`;


        player.miniArt.style.backgroundSize =
            "cover";


        player.miniArt.style.backgroundPosition =
            "center";


        player.miniArt.textContent =
            "";

    }


    // --------------------------------------------------------
    // NEW SONG = START FROM 0
    // --------------------------------------------------------

    player.audio.src =
        song.streamUrl;

    player.audio.load();


    if (
        player.progress
    ) {

        player.progress.value =
            0;

    }


    try {

        await player.audio.play();

        updatePlayButton(
            true
        );


        // ====================================================
        // RECORD ONE STREAM
        // ====================================================

        try {

            const streamResponse =
                await fetch(
                    `${API_BASE}/music/${encodeURIComponent(song.id)}/stream`,
                    {
                        method: "POST"
                    }
                );


            if (
                !streamResponse.ok
            ) {

                console.warn(
                    "MELO - Unable to record stream:",
                    streamResponse.status
                );

            }

            else {

                const streamData =
                    await streamResponse.json();


                const catalogSong =
                    findMusicById(
                        song.id
                    );


                if (
                    catalogSong &&
                    streamData.streams !== undefined
                ) {

                    catalogSong.streams =
                        Number(
                            streamData.streams
                        ) || 0;

                }


                console.log(
                    "MELO - Stream recorded:",
                    streamData
                );

            }

        }

        catch (
            streamError
        ) {

            console.warn(
                "MELO - Stream count request failed:",
                streamError
            );

        }

    }

    catch (
        error
    ) {

        console.error(
            "Unable to play song:",
            error
        );


        updatePlayButton(
            false
        );

    }
}


function playSongFromIndex(
    index
) {

    if (
        index < 0 ||
        index >=
            visibleMusic.length
    ) {

        return;
    }


    playSong(
        visibleMusic[
            index
        ]
    );
}


function updatePlayButton(
    playing
) {

    const button =
        document.getElementById(
            "playButton"
        );


    if (button) {

        button.textContent =
            playing
                ? "❚❚"
                : "▶";

    }
}


function togglePlayback() {

    const player =
        getPlayer();


    if (
        !player.audio
    ) {

        return;
    }


    if (
        !player.audio.src
    ) {

        if (
            visibleMusic.length
        ) {

            playSongFromIndex(
                0
            );

        }

        return;
    }


    if (
        player.audio.paused
    ) {

        player.audio
            .play()
            .catch(
                error =>
                    console.error(
                        error
                    )
            );

    }

    else {

        player.audio.pause();

    }
}


function playNextSong() {

    if (
        !visibleMusic.length
    ) {

        return;
    }


    const nextIndex =
        currentSongIndex < 0

            ? 0

            : (
                currentSongIndex +
                1
            ) %
                visibleMusic.length;


    playSongFromIndex(
        nextIndex
    );
}


function playPreviousSong() {

    if (
        !visibleMusic.length
    ) {

        return;
    }


    const previousIndex =
        currentSongIndex <= 0

            ? visibleMusic.length -
              1

            : currentSongIndex -
              1;


    playSongFromIndex(
        previousIndex
    );
}


function setupPlayer() {

    const player =
        getPlayer();


    if (
        !player.audio
    ) {

        return;
    }


    // --------------------------------------------------------
    // PLAYER BUTTONS
    // --------------------------------------------------------

    if (
        player.play
    ) {

        player.play.addEventListener(
            "click",
            togglePlayback
        );

    }


    if (
        player.previous
    ) {

        player.previous.addEventListener(
            "click",
            playPreviousSong
        );

    }


    if (
        player.next
    ) {

        player.next.addEventListener(
            "click",
            playNextSong
        );

    }


    // --------------------------------------------------------
    // VOLUME
    // --------------------------------------------------------

    if (
        player.volume
    ) {

        player.audio.volume =
            Number(
                player.volume.value ||
                1
            );


        player.volume.addEventListener(
            "input",
            function () {

                player.audio.volume =
                    Number(
                        player.volume.value
                    );

            }
        );

    }


    // --------------------------------------------------------
    // PROGRESS / SEEKING
    // --------------------------------------------------------

    let isSeeking =
        false;


    let pendingSeekValue =
        0;


    if (
        player.progress
    ) {

        // Always use percentage from 0 to 100.
        player.progress.min =
            "0";

        player.progress.max =
            "100";

        player.progress.step =
            "0.1";


        // ----------------------------------------------------
        // USER STARTS DRAGGING
        // ----------------------------------------------------

        player.progress.addEventListener(
            "pointerdown",
            function () {

                isSeeking =
                    true;

            }
        );


        player.progress.addEventListener(
            "mousedown",
            function () {

                isSeeking =
                    true;

            }
        );


        player.progress.addEventListener(
            "touchstart",
            function () {

                isSeeking =
                    true;

            },
            {
                passive: true
            }
        );


        // ----------------------------------------------------
        // USER MOVES THE SLIDER
        // ----------------------------------------------------

        player.progress.addEventListener(
            "input",
            function () {

                if (
                    !Number.isFinite(
                        player.audio.duration
                    ) ||
                    player.audio.duration <=
                        0
                ) {

                    return;
                }


                pendingSeekValue =
                    Number(
                        player.progress.value
                    );


                // Show the selected time immediately.
                const previewTime =
                    (
                        pendingSeekValue /
                        100
                    ) *
                    player.audio.duration;


                if (
                    player.currentTime
                ) {

                    player.currentTime.textContent =
                        formatTime(
                            previewTime
                        );

                }

            }
        );


        // ----------------------------------------------------
        // USER RELEASES SLIDER
        // ----------------------------------------------------

        function finishSeeking() {

            if (
                !isSeeking
            ) {

                return;
            }


            if (
                !Number.isFinite(
                    player.audio.duration
                ) ||
                player.audio.duration <=
                    0
            ) {

                isSeeking =
                    false;

                return;
            }


            const percentage =
                Number(
                    player.progress.value
                );


            const newTime =
                (
                    percentage /
                    100
                ) *
                player.audio.duration;


            if (
                Number.isFinite(
                    newTime
                )
            ) {

                player.audio.currentTime =
                    Math.max(
                        0,
                        Math.min(
                            newTime,
                            player.audio.duration
                        )
                    );

            }


            isSeeking =
                false;


            // Immediately synchronize the displayed time.
            if (
                player.currentTime
            ) {

                player.currentTime.textContent =
                    formatTime(
                        player.audio.currentTime
                    );

            }

        }


        player.progress.addEventListener(
            "change",
            finishSeeking
        );


        player.progress.addEventListener(
            "pointerup",
            finishSeeking
        );


        player.progress.addEventListener(
            "mouseup",
            finishSeeking
        );


        player.progress.addEventListener(
            "touchend",
            finishSeeking
        );


        // Safety: if the pointer leaves the slider.
        document.addEventListener(
            "pointerup",
            finishSeeking
        );

    }


    // --------------------------------------------------------
    // AUDIO TIME UPDATE
    // --------------------------------------------------------

    player.audio.addEventListener(
        "timeupdate",
        function () {

            if (
                player.currentTime &&
                !isSeeking
            ) {

                player.currentTime.textContent =
                    formatTime(
                        player.audio.currentTime
                    );

            }


            if (
                player.progress &&
                Number.isFinite(
                    player.audio.duration
                ) &&
                player.audio.duration > 0 &&
                !isSeeking
            ) {

                player.progress.value =
                    (
                        player.audio.currentTime /
                        player.audio.duration
                    ) *
                    100;

            }

        }
    );


    // --------------------------------------------------------
    // AUDIO METADATA
    // --------------------------------------------------------

    player.audio.addEventListener(
        "loadedmetadata",
        function () {

            if (
                player.duration
            ) {

                player.duration.textContent =
                    formatTime(
                        player.audio.duration
                    );

            }


            if (
                player.progress
            ) {

                player.progress.min =
                    "0";

                player.progress.max =
                    "100";

                player.progress.value =
                    0;

            }

        }
    );


    // --------------------------------------------------------
    // PLAY / PAUSE
    // --------------------------------------------------------

    player.audio.addEventListener(
        "play",
        function () {

            updatePlayButton(
                true
            );

        }
    );


    player.audio.addEventListener(
        "pause",
        function () {

            updatePlayButton(
                false
            );

        }
    );


    // --------------------------------------------------------
    // NEXT SONG WHEN FINISHED
    // --------------------------------------------------------

    player.audio.addEventListener(
        "ended",
        function () {

            playNextSong();

        }
    );


    // --------------------------------------------------------
    // MUSIC CARD PLAY BUTTONS
    // --------------------------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".card-play"
                );


            if (
                !button
            ) {

                return;
            }


            if (
                button.classList.contains(
                    "recent-card-play"
                )
            ) {

                return;
            }


            event.preventDefault();


            const index =
                Number(
                    button.dataset
                        .songIndex
                );


            playSongFromIndex(
                index
            );

        }
    );
}

// ============================================================
// PERSONAL LIBRARY
// ============================================================

function setupPersonalLibrary() {

    updatePersonalLibraryVisibility();

    setupCreatePlaylistButton();

    renderPlaylists();

    renderFollowedArtists();
}


function renderPersonalLibrary() {

    updatePersonalLibraryVisibility();

    renderPlaylists();

    renderFollowedArtists();
}


window.addEventListener("storage", function (event) {

    if (event.key !== "meloLikeSync" || !event.newValue) {
        return;
    }

    try {
        const data = JSON.parse(event.newValue);
        syncLikeButtonsForSong(
            data.songId,
            Boolean(data.liked),
            Number(data.likes || 0)
        );
    } catch {
        // Ignore malformed sync data.
    }
});


// ============================================================
// LOAD MAIN PAGE
// ============================================================

async function loadMusicIntoFrontend() {

    const isHome =
        Boolean(
            document.getElementById(
                "homeMusicGrid"
            )
        );


    const isBrowse =
        Boolean(
            document.getElementById(
                "browseMusicGrid"
            )
        );


    if (
        !isHome &&
        !isBrowse
    ) {

        return;
    }


    const loaded =
        await fetchApprovedMusic();


    if (!loaded) {
        return;
    }


    /*
       Start with the COMPLETE approved
       catalog visible.

       This guarantees that newly approved
       artist music appears on Home.
    */

    visibleMusic =
        [...musicCatalog];


    filterMusic();


    setupGenreButtons();

    renderHomeRecentlyPlayed();

    renderArtists();

    renderPersonalLibrary();
}


// ============================================================
// REGISTRATION
// ============================================================

function setupRegistrationForm() {

    const form =
        document.getElementById(
            "registerForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document.getElementById(
                    "name"
                )?.value.trim();


            const email =
                document.getElementById(
                    "email"
                )?.value.trim();


            const password =
                document.getElementById(
                    "password"
                )?.value;


            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                )?.value;


            const role =
                document.getElementById(
                    "role"
                )?.value;


            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword ||
                !role
            ) {

                alert(
                    "Please fill all fields."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_BASE}/register`,
                        {

                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({

                                    name,

                                    email,

                                    password,

                                    role

                                })

                        }
                    );


                const text =
                    await response.text();


                let result =
                    text;


                try {

                    result =
                        JSON.parse(
                            text
                        );

                } catch {
                    // Plain text response.
                }


                if (
                    !response.ok
                ) {

                    alert(
                        typeof result ===
                            "string"

                            ? result

                            : (
                                result.message ||
                                "Registration failed."
                            )
                    );

                    return;
                }


                localStorage.setItem(
                    "meloUser",
                    JSON.stringify(
                        result
                    )
                );


                window.location.href =
                    result.role ===
                        "admin"

                        ? "admin.html"

                        : result.role ===
                            "artist"

                            ? "artist.html"

                            : "index.html";

            }

            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                alert(
                    "Unable to connect to MELO server."
                );

            }

        }
    );
}


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        updateAuthButton();

        updateDashboardLink();

        setupRegistrationForm();

        setupSearchInputs();

        setupPlayer();

        setupPersonalLibrary();

        await loadMusicIntoFrontend();

        renderHomeRecentlyPlayed();

        renderPersonalLibrary();

        renderArtists();

    }
);