import axios from "axios";

export default async (req, res) => {
  const response = await axios.get(
    "https://celestrak.com/NORAD/elements/starlink.txt"
  );
  res.statusCode = 200;
  res.send(response.data);
};
