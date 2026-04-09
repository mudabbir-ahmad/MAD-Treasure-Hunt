import {StyleSheet, Text, View} from 'react-native';
import Card from '../UI/Card';
import {Button} from '../UI/Button';

const CacheCardItem = ({cache, isAdmin, isClaimed, isSelected, onEdit, onDelete, onSelect, disabled, departmentName}) => {
//   Initialisation -------------

    const displayName = cache.name || cache.clue || 'Unnamed Cache';

//   State ----------------------
//   Handlers -------------------
//   View -----------------------

    return (
        <Card style={[isSelected && styles.selectedCard, isClaimed && styles.claimedCard, disabled && styles.disabledCard]}>
            <View style={styles.topRow}>
                <View style={styles.nameWrap}>
                    <Text style={[styles.name, isClaimed && styles.claimedText, disabled && styles.disabledText]} numberOfLines={1}>{displayName}</Text>
                    {isAdmin && departmentName ? (
                        <Text style={styles.departmentText} numberOfLines={1}>Department: {departmentName}</Text>
                    ) : null}
                    {cache.name ? (
                        <Text style={styles.clue} numberOfLines={1}>{cache.clue}</Text>
                    ) : null}
                </View>
                {/* Players see team-specific claim status; admins see no status */}
                {!isAdmin && !disabled && (
                    <Text style={[styles.status, {color: isClaimed ? '#9ca3af' : '#16a34a'}]}>
                        {isClaimed ? 'Claimed' : 'Available'}
                    </Text>
                )}
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
                ) : disabled ? (
                    <Button
                        label="Join a Team First"
                        onClick={() => {}}
                        disabled={true}
                        styleButton={styles.claimedBtn}
                        styleLabel={styles.claimedBtnLabel}
                    />
                ) : isClaimed ? (
                    <Button
                        label="Already Claimed"
                        onClick={() => {}}
                        disabled={true}
                        styleButton={styles.claimedBtn}
                        styleLabel={styles.claimedBtnLabel}
                    />
                ) : isSelected ? (
                    <Button
                        label="Cache Currently Selected"
                        onClick={() => {}}
                        styleButton={styles.selectedBtn}
                        styleLabel={styles.selectedBtnLabel}
                    />
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
    clue: {fontSize: 13, color: '#6b7280', marginTop: 2},
    departmentText: {fontSize: 13, color: '#2563eb', marginTop: 2, fontWeight: '600'},
    nameWrap: {flex: 1, marginRight: 8},
    name: {fontSize: 15, fontWeight: '600', color: '#1f2937'},
    claimedText: {color: '#9ca3af'},
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
    selectedBtn: {
        backgroundColor: '#6b7280',
        borderColor: '#6b7280',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    claimedBtn: {
        backgroundColor: '#d1d5db',
        borderColor: '#d1d5db',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    claimedBtnLabel: {color: '#6b7280', fontWeight: '600', fontSize: 13},
    selectedBtnLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    selectedCard: {borderColor: '#2563eb', borderWidth: 2},
    claimedCard: {opacity: 0.5},
    disabledCard: {opacity: 0.45},
    disabledText: {color: '#9ca3af'},
    btnLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
});

export default CacheCardItem;

