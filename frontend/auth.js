function getLoggedInUser() {
    const userData = localStorage.getItem("meloUser");

    if (!userData) {
        return null;
    }

    try {
        return JSON.parse(userData);
    } catch (error) {
        console.error("Invalid user data:", error);
        return null;
    }
}

function isLoggedIn() {
    return getLoggedInUser() !== null;
}

function getUserRole() {
    const user = getLoggedInUser();

    if (!user) {
        return null;
    }

    return user.role;
}

function logoutUser() {
    localStorage.removeItem("meloUser");
    window.location.href = "index.html";
}


// =========================================
// CROSS-TAB MUSIC PLAYER COORDINATION
// =========================================
// MELO can have a player on more than one page/tab.
// This keeps only one audio element playing at a time.

const MELO_PLAYER_COMMAND_KEY = "meloPlayerCommand";
const MELO_PLAYER_CHANNEL_NAME = "melo-player-channel";

let meloPlayerInstanceId = null;
let meloPlayerChannel = null;

function getMeloPlayerInstanceId() {
    if (meloPlayerInstanceId) {
        return meloPlayerInstanceId;
    }

    try {
        meloPlayerInstanceId = sessionStorage.getItem(
            "meloPlayerInstanceId"
        );

        if (!meloPlayerInstanceId) {
            meloPlayerInstanceId =
                `${Date.now()}-${Math.random().toString(36).slice(2)}`;

            sessionStorage.setItem(
                "meloPlayerInstanceId",
                meloPlayerInstanceId
            );
        }
    } catch (error) {
        meloPlayerInstanceId =
            `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    return meloPlayerInstanceId;
}

function getMeloAudioElement() {
    return (
        document.getElementById("audioPlayer") ||
        document.getElementById("recentDashboardPlayer")
    );
}

function broadcastMeloPlaybackStart(audio) {
    if (!audio) {
        return;
    }

    const message = {
        action: "play",
        instanceId: getMeloPlayerInstanceId(),
        timestamp: Date.now(),
        source: window.location.pathname,
        src: audio.currentSrc || audio.src || ""
    };

    // localStorage works as a fallback and also
    // communicates with other browser tabs.
    try {
        localStorage.setItem(
            MELO_PLAYER_COMMAND_KEY,
            JSON.stringify(message)
        );
    } catch (error) {
        console.warn(
            "MELO player storage broadcast failed:",
            error
        );
    }

    // BroadcastChannel gives faster communication
    // between tabs when supported by the browser.
    if (meloPlayerChannel) {
        try {
            meloPlayerChannel.postMessage(message);
        } catch (error) {
            console.warn(
                "MELO player channel broadcast failed:",
                error
            );
        }
    }
}

function pauseMeloAudioFromOtherTab(message) {
    if (!message || message.action !== "play") {
        return;
    }

    // Ignore our own message.
    if (message.instanceId === getMeloPlayerInstanceId()) {
        return;
    }

    const audio = getMeloAudioElement();

    if (!audio) {
        return;
    }

    if (!audio.paused) {
        audio.pause();
    }
}

function setupMeloCrossTabPlayer() {
    const audio = getMeloAudioElement();

    if (audio) {
        getMeloPlayerInstanceId();

        // Whenever this tab starts playing,
        // tell every other MELO tab to pause.
        audio.addEventListener("play", function () {
            broadcastMeloPlaybackStart(audio);
        });
    }

    // localStorage fallback
    window.addEventListener("storage", function (event) {
        if (
            event.key !== MELO_PLAYER_COMMAND_KEY ||
            !event.newValue
        ) {
            return;
        }

        try {
            const message = JSON.parse(event.newValue);

            pauseMeloAudioFromOtherTab(message);

        } catch (error) {
            console.warn(
                "Invalid MELO player command:",
                error
            );
        }
    });

    // BroadcastChannel communication
    if (typeof BroadcastChannel !== "undefined") {
        try {
            meloPlayerChannel = new BroadcastChannel(
                MELO_PLAYER_CHANNEL_NAME
            );

            meloPlayerChannel.addEventListener(
                "message",
                function (event) {
                    pauseMeloAudioFromOtherTab(event.data);
                }
            );

        } catch (error) {
            console.warn(
                "MELO BroadcastChannel unavailable:",
                error
            );

            meloPlayerChannel = null;
        }
    }
}

setupMeloCrossTabPlayer();