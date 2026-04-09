import {StyleSheet, View} from 'react-native';

const Card = ({children, style}) => {
//   Initialisation -------------
//   State ----------------------
//   Handlers -------------------
//   View -----------------------

    return (
        <View style={[styles.card, style]}>{children}</View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#313244',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#45475a',
    },
});

export default Card;

