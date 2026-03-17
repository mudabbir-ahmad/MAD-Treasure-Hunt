import {useCallback, useEffect, useMemo, useState} from 'react';
import {createSubgroup, getVisibleSubgroups, updateSubgroupCache} from '../API/API';
import {getSession} from '../Model/SessionStore';

const useSubgroupAdminViewModel = () => {
  const [subgroups, setSubgroups] = useState([]);
  const [subgroupName, setSubgroupName] = useState('');
  const [cacheTriggerMeters, setCacheTriggerMeters] = useState('20');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentGid } = getSession();

  const loadSubgroups = useCallback(async () => {
    if (!currentGid) {
      return;
    }
    const rows = await getVisibleSubgroups(currentGid);
    setSubgroups(rows);
  }, [currentGid]);

  const filteredSubgroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return subgroups;
    }
    const q = searchQuery.trim().toLowerCase();
    return subgroups.filter((sg) => {
      const nameMatch = sg.SubGroupName.toLowerCase().includes(q);
      const idMatch = String(sg.SGid) === q;
      return nameMatch || idMatch;
    });
  }, [subgroups, searchQuery]);

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
    filteredSubgroups,
    searchQuery,
    subgroupName,
    cacheTriggerMeters,
    error,
    setSearchQuery,
    setSubgroupName,
    setCacheTriggerMeters,
    addSubgroup,
    updateCacheForSubgroup,
  };
};

export default useSubgroupAdminViewModel;

