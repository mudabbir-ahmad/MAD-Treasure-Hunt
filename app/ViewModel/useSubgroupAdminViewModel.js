import { useCallback, useEffect, useState } from 'react';
import { createSubgroup, getSubgroups, updateSubgroupCache } from '../API/API';
import { getSession } from '../Model/SessionStore';

const useSubgroupAdminViewModel = () => {
  const [subgroups, setSubgroups] = useState([]);
  const [subgroupName, setSubgroupName] = useState('');
  const [cacheTriggerMeters, setCacheTriggerMeters] = useState('20');
  const [error, setError] = useState('');
  const { currentGid } = getSession();

  const loadSubgroups = useCallback(async () => {
    if (!currentGid) {
      return;
    }
    const rows = await getSubgroups(currentGid);
    setSubgroups(rows);
  }, [currentGid]);

  useEffect(() => {
    loadSubgroups();
  }, [loadSubgroups]);

  const addSubgroup = async () => {
    setError('');
    try {
      await createSubgroup({
        gid: currentGid,
        subgroupName: subgroupName.trim(),
        cacheTriggerMeters: Number(cacheTriggerMeters),
      });
      setSubgroupName('');
      await loadSubgroups();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  const updateCacheForSubgroup = async (sgid, triggerMeters) => {
    setError('');
    try {
      await updateSubgroupCache({ gid: currentGid, sgid, triggerMeters });
      await loadSubgroups();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  return {
    subgroups,
    subgroupName,
    cacheTriggerMeters,
    error,
    setSubgroupName,
    setCacheTriggerMeters,
    addSubgroup,
    updateCacheForSubgroup,
  };
};

export default useSubgroupAdminViewModel;

