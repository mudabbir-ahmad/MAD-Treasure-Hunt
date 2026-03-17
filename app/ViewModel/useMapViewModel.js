import { useEffect, useState } from 'react';
import { getMapPoints } from '../API/API';
import { getSession } from '../Model/SessionStore';

const useMapViewModel = (groupId = null) => {
  const [points, setPoints] = useState([]);
  const { currentGid, currentSGid } = getSession();
  const resolvedGid = groupId ?? currentGid;

  useEffect(() => {
    if (!resolvedGid) {
      setPoints([]);
      return;
    }
    let active = true;
    getMapPoints(resolvedGid, currentSGid).then((payload) => {
      if (active) {
        setPoints(payload);
      }
    });
    return () => {
      active = false;
    };
  }, [resolvedGid, currentSGid]);

  return { points };
};

export default useMapViewModel;

