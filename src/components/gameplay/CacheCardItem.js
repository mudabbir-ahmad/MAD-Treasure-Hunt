import {StyleSheet, Text, View} from 'react-native';
import Card from '../UI/Card';
import {Button} from '../UI/Button';

const CacheCardItem = ({cache, isAdmin, isClaimed, isSelected, onEdit, onDelete, onSelect, disabled, departmentName}) => {
  // Display name fallback for cache without a name
  const displayName = cache.name || cache.clue || 'Unnamed Cache';

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
        {!isAdmin && !disabled && (
          <Text style={[styles.status, {color: isClaimed ? '#585b70' : '#a6e3a1'}]}>
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
    clue: {fontSize: 13, color: '#6c7086', marginTop: 2},
    departmentText: {fontSize: 13, color: '#89b4fa', marginTop: 2, fontWeight: '600'},
    nameWrap: {flex: 1, marginRight: 8},
    name: {fontSize: 15, fontWeight: '600', color: '#cdd6f4'},
    claimedText: {color: '#6c7086'},
    status: {fontSize: 13, fontWeight: '600'},
    actions: {flexDirection: 'row', gap: 8},
    editBtn: {
        backgroundColor: '#89b4fa',
        borderColor: '#89b4fa',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    deleteBtn: {
        backgroundColor: '#f38ba8',
        borderColor: '#f38ba8',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    selectBtn: {
        backgroundColor: '#a6e3a1',
        borderColor: '#a6e3a1',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    selectedBtn: {
        backgroundColor: '#6c7086',
        borderColor: '#6c7086',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    claimedBtn: {
        backgroundColor: '#45475a',
        borderColor: '#45475a',
        minHeight: 36,
        paddingHorizontal: 14,
        flex: 1,
    },
    claimedBtnLabel: {color: '#6c7086', fontWeight: '600', fontSize: 13},
    selectedBtnLabel: {color: '#cdd6f4', fontWeight: '600', fontSize: 13},
    selectedCard: {borderColor: '#89b4fa', borderWidth: 2},
    claimedCard: {opacity: 0.5},
    disabledCard: {opacity: 0.45},
    disabledText: {color: '#6c7086'},
    btnLabel: {color: '#cdd6f4', fontWeight: '600', fontSize: 13},
});

export default CacheCardItem;

