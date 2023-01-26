const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbDistrictObjectToResponseObject = (dbDistrictObject) => {
  return {
    districtId: dbDistrictObject.district_id,
    districtName: dbDistrictObject.district_name,
    stateId: dbDistrictObject.state_id,
    cases: dbDistrictObject.cases,
    cured: dbDistrictObject.cured,
    active: dbDistrictObject.active,
    deaths: dbDistrictObject.deaths,
  };
};

//Get States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT *
        FROM state
        `;
  const states = await db.all(getStatesQuery);
  response.send(
    states.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//Get State API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
        SELECT * 
        FROM state
        WHERE state_id = ${stateId}`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//Add District API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO 
            district(district_name, state_id, cases, cured, active, deaths)
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        ) `;
  const dbResponse = await db.run(addDistrictQuery);

  response.send("District Successfully Added");
});

//Get District API
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT * 
        FROM district
        WHERE district_id = ${districtId}`;
  const dbResponse = await db.get(getDistrictQuery);
  response.send(convertDbDistrictObjectToResponseObject(dbResponse));
});

//Delete District API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId}`;
  const dbResponse = await db.run(deleteDistrictQuery);
  convertDbDistrictObjectToResponseObject(dbResponse);
  response.send("District Removed");
});

//Update District API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
        UPDATE district
        SET 
        district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  const dbResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get Statistics API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
        SELECT SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
        FROM district
        WHERE state_id = ${stateId}`;
  const dbResponse = await db.get(getStatisticsQuery);
  response.send(dbResponse);
});

//Get stateName API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT state_name AS stateName
    FROM state
    ORDER BY state_id`;
  const statesArray = await db.get(getStateNameQuery);
  response.send(statesArray);
});

module.exports = app;
