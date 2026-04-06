import {StyleSheet, Text, View} from 'react-native';
import Card from '../UI/Card';
import {Button} from '../UI/Button';

const CacheCardItem = ({cache, isAdmin, onEdit, onDelete, onSelect}) => {
//   Initialisation -------------

    const isClaimed = Boolean(cache.ClaimedByUid);
    const statusText = isClaimed ? 'Claimed' : 'Available';
    const statusColor = isClaimed ? '#9ca3af' : '#16a34a';

//   State ----------------------
//   Handlers -------------------
//   View -----------------------

    return (
        <Card>
            <View style={styles.topRow}>
                <Text style={styles.clue} numberOfLines={1}>{cache.clue}</Text>
                <Text style={[styles.status, {color: statusColor}]}>{statusText}</Text>
            </View>
            <View style={styles.actions}>
                {isAdmin ? (
                    <>
                        <Button
                            label="Edit"
                            onClick={() => onEdit(cache)}
                            styleButton={styles.editBtn}
                            styleLabel={styles.btnLabel}
                        />
                        <Button
                            label="Delete"
                            onClick={() => onDelete(cache)}
                            styleButton={styles.deleteBtn}
                            styleLabel={styles.btnLabel}
                        />
                    </>
                ) : (
                    <Button
                        label="Select Cache"
                        onClick={() => onSelect(cache)}
                        styleButton={styles.selectBtn}
                        styleLabel={styles.btnLabel}
                    />
                )}
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clue: {fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 8},
    status: {fontSize: 13, fontWeight: '600'},
    actions: {flexDirection: 'row', gap: 8},
    editBtn: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    deleteBtn: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    selectBtn: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    btnLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
});

export default CacheCardItem;

