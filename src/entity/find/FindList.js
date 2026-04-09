import { ScrollView, StyleSheet } from "react-native";
import FindItem from "./FindItem";

const FindList = ({ finds }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------

  return (
    <ScrollView style={styles.container}>
      {finds.map((find) => (
        <FindItem key={find.FindID} find={find} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default FindList;
