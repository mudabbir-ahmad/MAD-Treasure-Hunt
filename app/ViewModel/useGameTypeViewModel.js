import { useEffect, useState } from 'react';
import { getGameTypes } from '../API/API';

const useGameTypeViewModel = () => {
  const [gameTypes, setGameTypes] = useState([]);

  useEffect(() => {
    let mounted = true;
    getGameTypes().then((types) => {
      if (mounted) {
        setGameTypes(types);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { gameTypes };
};

export default useGameTypeViewModel;

