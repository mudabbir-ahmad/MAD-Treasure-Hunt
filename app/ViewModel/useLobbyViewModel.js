import { useState } from 'react';
import { createTeam, getLobby, joinTeam } from '../API/API';
import { getSession, setSessionTeam } from '../Model/SessionStore';

const useLobbyViewModel = () => {
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');

  const loadLobby = async () => {
    const { currentGid } = getSession();
    return getLobby(currentGid);
  };

  const createLobbyTeam = async ({ teamName }) => {
    setError('');
    try {
      const { currentUid, currentGid } = getSession();
      const team = await createTeam({ userId: currentUid, gid: currentGid, teamName });
      setSessionTeam(team.Tid);
      return team;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const joinLobbyTeam = async () => {
    setError('');
    try {
      const { currentUid } = getSession();
      const team = await joinTeam({ userId: currentUid, teamCode: teamCode.trim().toUpperCase() });
      setSessionTeam(team.Tid);
      return team;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  return {
    teamCode,
    error,
    setTeamCode,
    loadLobby,
    createLobbyTeam,
    joinLobbyTeam,
  };
};

export default useLobbyViewModel;

