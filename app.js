const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);

    process.exit(1);
  }
};

initializeDbAndServer();

//get a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
          player_id AS playerId, player_name AS playerName 
        FROM 
            player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

// get a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT 
         player_id AS playerId,
         player_name AS playerName
        FROM 
            player_details
        WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

//Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE 
            player_details 
        SET 
            player_name = '${playerName}'
        WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// get the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
    SELECT 
        match_id AS matchId,
        match, 
        year
    FROM 
        match_details
    WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(matchDetails);
});

// get a list of all the matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT 
         match_id AS matchId,
         match,
         year 
        FROM player_match_score NATURAL JOIN match_details 
        WHERE player_id = ${playerId};`;
  const playerMatchesArray = await db.all(getPlayerMatchesQuery);
  response.send(playerMatchesArray);
});

//get a list of players of a specific match

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT 
        player_match_score.player_id AS playerId ,
        player_name AS playerName
    FROM 
     player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE match_id = ${matchId};`;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  response.send(matchPlayers);
});

//get the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(player_match_score.score) AS totalScore,
            SUM(player_match_score.fours) AS totalFours,
            SUM(player_match_score.sixes) AS totalSixes
        FROM 
         player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId};`;
  const playerScores = await db.get(getPlayerScoreQuery);
  response.send(playerScores);
});

module.exports = app;
