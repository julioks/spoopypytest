// Get the hash of the url
const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce(function (initial, item) {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }
    return initial;
  }, {});
window.location.hash = "";

// Set token
let _token = hash.access_token;

const authEndpoint = "https://accounts.spotify.com/authorize";

// Replace with your app's client ID, redirect URI and desired scopes
const clientId = "3c67ea547d4440a183005ec027d7c2a1";
const redirectUri = "https://julioks.github.io/spoopypytest/";
const scopes = [
  "streaming",
  "user-read-birthdate",
  "user-read-private",
  "user-modify-playback-state",
  "user-top-read",
];

// If there is no token, redirect to Spotify authorization
if (!_token) {
  window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
  )}&response_type=token`;
}

// Set up the Web Playback SDK

let deviceId;

window.onSpotifyPlayerAPIReady = () => {
  const player = new Spotify.Player({
    name: "Big Spotify Button",
    getOAuthToken: (cb) => {
      cb(_token);
    },
  });

  // Error handling
  player.on("initialization_error", (e) => console.error(e));
  player.on("authentication_error", (e) => console.error(e));
  player.on("account_error", (e) => console.error(e));
  player.on("playback_error", (e) => console.error(e));

  // Playback status updates
  player.on("player_state_changed", (state) => {
    console.log(state);
    $("#current-track").attr(
      "src",
      state.track_window.current_track.album.images[0].url
    );
    $("#current-track-name").text(state.track_window.current_track.name);
  });

  // Ready
  player.on("ready", (data) => {
    console.log("Ready with Device ID", data.device_id);
    deviceId = data.device_id;
  });

  // Connect to the player!
  player.connect();
};

function getASong() {
  topArtists();
}

// Get top 5 artist IDs
function topArtists() {
  $.ajax({
    url: "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term",
    type: "GET",
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + _token);
    },
    success: function (data) {
      let ids = data.items.map((artist) => artist.id).join(",");
      getRecommendations(ids);
    },
  });
}

// Get Recommendations based on artist seeds
function getRecommendations(seeds) {
  $.ajax({
    url:
      "https://api.spotify.com/v1/recommendations?seed_artists=" +
      seeds +
      "&limit=1",
    type: "GET",
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + _token);
    },
    success: function (data) {
      console.log(data);
      let trackUri = data.tracks[0].uri;
      play(deviceId, trackUri);
    },
  });
}

// Play a specified track on the Web Playback SDK's device ID
function play(device_id, track) {
  $.ajax({
    url: "https://api.spotify.com/v1/me/player/play?device_id=" + device_id,
    type: "PUT",
    data: `{"uris": ["${track}"]}`,
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", "Bearer " + _token);
    },
    success: function (data) {
      console.log(data);
    },
  });
}
