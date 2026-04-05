import {useEffect, useState} from "react";
import API from "./API";


const useLoad = (loadEndpoint) => {

    //   State ----------------------

    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    //   Loader ----------------------
    const loadRecords = async (endpoint) => {
        setIsLoading(true);
        const response = await API.get(endpoint);
        if (response.isSuccess) setRecords(response.result);
        setIsLoading(false);
    };

    useEffect(() => {
        loadRecords(loadEndpoint);
    }, []);

    //   return ----------------------

    return [records, setRecords, isLoading, loadRecords];
};

export default useLoad;

