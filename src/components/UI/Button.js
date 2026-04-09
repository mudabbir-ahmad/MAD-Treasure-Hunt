import {Pressable, StyleSheet, Text, View} from "react-native";

export const Button = ({ label, icon, onClick, styleLabel, styleButton, disabled }) => {
  //   Initialisation -------------
  //   State ----------------------
  //   Handlers -------------------
  //   View -----------------------

  return (
    <Pressable onPress={onClick} disabled={disabled} style={[styles.button, styleButton, disabled && styles.buttonDisabled]}>
      {icon ? icon : null}
      <Text style={[styles.label, styleLabel, disabled && styles.labelDisabled]}>{label}</Text>
    </Pressable>
  );
};

export const ButtonTray = ({ children }) => {
  //   Initialisation -------------
  //   State ----------------------
  //   Handlers -------------------
  //   View -----------------------

  return <View style={styles.buttonTray}>{children}</View>;
};

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 7,
    borderColor: "grey",
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  label: {
    fontSize: 16,
  },
  buttonTray: {
    flexDirection: "row",
    gap: 15,
  },
  // Greyed-out state for buttons that should not be interactive
  buttonDisabled: {
    opacity: 0.4,
  },
  labelDisabled: {
    color: '#9ca3af',
  },
});

