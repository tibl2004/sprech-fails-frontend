import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Versprecher.scss";

// Kleine Emoji-Liste für Palette (kann beliebig erweitert werden)
const emojiPalette = ["😂","😮","😡","❤️","👍","🎉","😢","😎","🤯","😇"];

const Versprecher = () => {
  const [versprecherListe, setVersprecherListe] = useState([]);
  const [newText, setNewText] = useState("");
  const [newPerson, setNewPerson] = useState("Nico");
  const [activePalette, setActivePalette] = useState(null);
  const [userReactions, setUserReactions] = useState({}); // {versprecher_id: emoji}

  const fetchVersprecher = async () => {
    try {
      const res = await axios.get("https://sprechfails-backend.onrender.com/api/versprecher");

      // Falls Backend ein Objekt mit data-Feld liefert
      const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      
      setVersprecherListe(data);

      const initialReactions = {};
      data.forEach(v => {
        if (Array.isArray(v.reaktionen) && v.reaktionen.length > 0) {
          initialReactions[v.id] = v.reaktionen[0]?.emoji || null;
        }
      });
      setUserReactions(initialReactions);
    } catch (err) {
      console.error("Fehler beim Laden der Versprecher:", err);
    }
  };

  useEffect(() => { fetchVersprecher(); }, []);

  const createVersprecher = async () => {
    if(!newText) return;
    try {
      await axios.post("https://sprechfails-backend.onrender.com/api/versprecher/create", { text: newText, person: newPerson });
      setNewText("");
      fetchVersprecher();
    } catch(err){ console.error(err); }
  };

  const deleteVersprecher = async (id) => {
    try {
      await axios.post("https://sprechfails-backend.onrender.com/api/versprecher/delete",{id});
      fetchVersprecher();
    } catch(err){ console.error(err); }
  };

  const togglePalette = (id) => {
    setActivePalette(activePalette === id ? null : id);
  };

  const selectEmoji = async (versprecher_id, emoji) => {
    const current = userReactions[versprecher_id];
    try {
      if(current === emoji){
        const reactionObj = versprecherListe.find(v => v.id === versprecher_id)
                                            ?.reaktionen?.find(r => r.emoji === emoji);
        if(reactionObj){
          await axios.post("https://sprechfails-backend.onrender.com/api/reaktionen/delete",{id: reactionObj.id});
        }
        setUserReactions(prev=> ({...prev,[versprecher_id]: null}));
      } else {
        await axios.post("https://sprechfails-backend.onrender.com/api/reaktionen/create",{versprecher_id, emoji});
        setUserReactions(prev => ({...prev,[versprecher_id]: emoji}));
      }
      setActivePalette(null);
      fetchVersprecher();
    } catch(err){ console.error(err); }
  };

  return (
    <div className="versprecher-dashboard">
      <h1>Versprecher Dashboard</h1>

      <div className="new-versprecher">
        <input 
          type="text" 
          placeholder="Neuen Versprecher..." 
          value={newText} 
          onChange={e=>setNewText(e.target.value)} 
        />
        <select value={newPerson} onChange={e=>setNewPerson(e.target.value)}>
          <option value="Nico">Nico</option>
          <option value="Timo">Timo</option>
        </select>
        <button onClick={createVersprecher}>Hinzufügen</button>
      </div>

      <div className="versprecher-list">
        {Array.isArray(versprecherListe) && versprecherListe.map(v=>(
          <div key={v.id} className="versprecher-card">
            <div className="versprecher-header">
              <span className="person">{v.person}</span>
              <button className="delete-btn" onClick={()=>deleteVersprecher(v.id)}>✖</button>
            </div>
            <p className="text">{v.text}</p>

            <div className="reactions">
              {Array.isArray(v.reaktionen) && v.reaktionen.map((r, idx) => (
                <span key={idx} className="emoji">
                  {r.count > 1 ? `${r.emoji} x${r.count}` : r.emoji}
                </span>
              ))}
            </div>

            <div className="emoji-hover">
              <button className="open-palette-btn" onClick={()=>togglePalette(v.id)}>😊</button>
              {activePalette === v.id && (
                <div className="emoji-palette">
                  {emojiPalette.map(e=>(
                    <button key={e} onClick={()=>selectEmoji(v.id,e)}>{e}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Versprecher;
