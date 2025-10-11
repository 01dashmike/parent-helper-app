import express from "express";
import { storage } from "../storage.js";

const router = express.Router();

const townData: Record<string, { population: string; train: string }> = {
  winchester: { population: "45,000", train: "Winchester" },
  andover: { population: "52,000", train: "Andover" },
  southampton: { population: "253,000", train: "Southampton Central" },
};

async function getPopulation(town: string) {
  const entry = townData[town.toLowerCase()];
  return {
    population: entry?.population ?? null,
    train: entry?.train ?? null,
  };
}

router.get("/api/local-context/:town", async (req, res) => {
  const { town } = req.params;

  try {
    const classes = await storage.searchClasses({
      postcode: town.toLowerCase(),
      includeInactive: false,
    });

    const venues = [...new Set(classes.map((c) => c.venue))].length;
    const parkingSpots = classes.filter((c) => c.parkingAvailable).length;
    const avgDistance = classes.length
      ? (
          classes.reduce(
            (sum, current) => sum + Number(current.distanceFromSearch ?? 0),
            0,
          ) / classes.length
        ).toFixed(1)
      : 0;

    const transportInfo = classes.find(
      (c) => c.nearestTubeStation || c.transportAccessibility,
    );

    const transport = transportInfo
      ? `Most venues are accessible by ${
          transportInfo.nearestTubeStation ? "tube/train" : "bus"
        }. ${parkingSpots} venues offer parking.`
      : `${parkingSpots} venues in ${town} offer parking for families.`;

    const populationInfo = await getPopulation(town);

    res.json({
      venues,
      parkingSpots,
      avgDistance,
      transport,
      population: populationInfo.population,
      nearestTrain: transportInfo?.nearestTubeStation ?? populationInfo.train ?? null,
    });
  } catch (error) {
    console.error("Error fetching local context:", error);
    res.json({
      venues: 0,
      parkingSpots: 0,
      avgDistance: 0,
      transport: "Local classes available",
      population: null,
      nearestTrain: null,
    });
  }
});

export default router;
