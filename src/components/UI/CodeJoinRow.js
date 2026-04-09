import {StyleSheet, TextInput, View} from 'react-native';
import {Button} from './Button';

const CodeJoinRow = ({
  value,
  onChange,
  placeholder,
  buttonLabel = 'Join',
  onSubmit,
  disabled = false,
  style,
}) => {
  //   Initialisation -------------
  //   State ----------------------
  //   Handlers -------------------
  //   View -----------------------

  return (
    <View style={[styles.inputRow, style]}>
      <TextInput
        style={[styles.codeInput, disabled && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={(text) => onChange(text.toUpperCase())}
        autoCapitalize="characters"
        editable={!disabled}
      />
      <Button
        label={buttonLabel}
        onClick={onSubmit}
        styleButton={styles.joinButton}
        styleLabel={styles.joinLabel}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 20,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#45475a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#cdd6f4',
    backgroundColor: '#313244',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  joinButton: {
    backgroundColor: '#bd93f9',
    borderColor: '#bd93f9',
    flex: 0,
    paddingHorizontal: 20,
  },
  joinLabel: {
    color: '#1e1e2e',
    fontWeight: '600',
  },
});

export default CodeJoinRow;

