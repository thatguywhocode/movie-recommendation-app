import { useState } from "react";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getRecommendations = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError("");
    setMovies([]);

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_input: input
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMovies(data.recommended_movies);
      }
    } catch (err) {
      setError("Unable to connect to server");
    }

    setLoading(false);
  };

  return (
    <div className="page">
      <div className="card">
        <h1>🎬 Movie Recommender</h1>
        <p className="subtitle">
          Enter your movie preference and get AI-based recommendations
        </p>

        <input
          type="text"
          placeholder="e.g. action movies with strong female lead"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button onClick={getRecommendations} disabled={loading}>
          {loading ? "Finding movies..." : "Get Recommendations"}
        </button>

        {error && <p className="error">{error}</p>}

        <div className="movie-list">
  {movies.map((movie, index) => (
    <a
      key={index}
      href={`https://www.imdb.com/find?q=${encodeURIComponent(movie)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="movie-card link-card"
    >
      🎥 {movie}
      <span className="link-text">View details →</span>
    </a>
  ))}
</div>

      </div>
    </div>
  );
}

export default App;
