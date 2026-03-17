import { useEffect, useState } from 'react';
import { getTeam } from '../API/API';
import { getSession } from '../Model/SessionStore';

const useTeamViewModel = (teamId = null) => {
  const [team, setTeam] = useState(null);
  const resolvedTeamId = teamId ?? getSession().currentTGid;

  useEffect(() => {
    if (!resolvedTeamId) {
      setTeam(null);
      return;
    }
    let active = true;
    getTeam(resolvedTeamId).then((payload) => {
      if (active) {
        setTeam(payload);
      }
    }).catch(() => {
      if (active) {
        setTeam(null);
      }
    });
    return () => {
      active = false;
    };
  }, [resolvedTeamId]);

  return { team };
};

export default useTeamViewModel;

