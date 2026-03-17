// If a user's subgroupID is 0, Treat them as ADMIN
// If a user's subgroupID is 1, Treat them as USER [For Public instances only subgroups avail are 0 and 1]
// If a user's subgroupID is 2, Treat them as USER [For Private instances, subgroups could range from 0-999 where 0 = admin, non 0 = member group]
// Use GroupID to link Subgroup to a group in the groups table, where subgroup --> defines permissions and whether the person is allowed to play or not.
// within subgroups have TeamGroups --> TeamGroups can come and go, they are not a fixed table [Team groups are enabled per admin request.]
// Team group ==> IF Teams are enabled a user can create a team group, if they're admin in team group they can kick people.
// All team groups have a unique JOIN CODE.
// User's table should have their [NULLABLE] unique Gid, SGid and TGid.
// Gid == GroupID || SGid == SubgroupID || TGid == TeamGroupID
// When a user logs in, we check their Gid, SGid and TGid to determine their permissions and what they can see on the front end.
// If a user is in a team group, they can only see other members of that team group and the games that team group is playing.
// If a user is in a subgroup, they can see all members of that subgroup and the games that subgroup is playing.
// If a user is in the admin subgroup, they can see all members and all games.

import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

const useLoginLogic = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://yourapi.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        alert("API error");
      }

      const data = await response.json();
      // Assuming the API returns user data including Gid, SGid, and TGid
      const { Gid, SGid, TGid } = data;

      // Dispatch user data to Redux store
      dispatch(setUser({ Gid, SGid, TGid }));

      // Navigate to the appropriate screen based on user role
      if (SGid === 0) {
        navigation.navigate('AdminDashboard');
      } else if (SGid === 1) {
        navigation.navigate('UserDashboard');
      } else {
        navigation.navigate('PrivateDashboard');
      }
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

export default LoginLogic;
