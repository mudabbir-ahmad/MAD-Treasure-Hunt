import { ScrollView, StyleSheet } from "react-native";
import EventItem from "./EventItem";

const EventList = ({ events, onSelect }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------

  return (
    <ScrollView style={styles.container}>
      {events.map((event) => (
        <EventItem key={event.EventID} event={event} onSelect={onSelect} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default EventList;
