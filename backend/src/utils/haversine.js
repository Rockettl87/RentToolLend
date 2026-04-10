// Haversine formula to calculate distance between two coordinates
const getDistanceMiles = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

// Convert miles to meters (for MongoDB $nearSphere)
const milesToMeters = (miles) => miles * 1609.344;

module.exports = { getDistanceMiles, milesToMeters };
