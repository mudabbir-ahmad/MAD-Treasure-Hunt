import {StyleSheet, Text} from 'react-native';
import Screen from '../layout/Screen';

const PendingApprovalView = ({message = 'Waiting for admin approval. You will get access once approved.'}) => (
    <Screen style={styles.center}>
        <Text style={styles.body}>{message}</Text>
    </Screen>
);

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center', flex: 1},
    body: {color: '#bac2de', fontSize: 15, textAlign: 'center', paddingHorizontal: 20},
});

export default PendingApprovalView;

