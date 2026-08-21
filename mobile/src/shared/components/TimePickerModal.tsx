import React, { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { colors } from "../theme/theme";

export function TimePickerModal({ visible, title, initialTime, onConfirm, onClose }: { visible: boolean; title: string; initialTime: string; onConfirm: (t: string) => void; onClose: () => void }) {
    const [hours, setHours] = useState(initialTime.split(":")[0]);
    const [minutes, setMinutes] = useState(initialTime.split(":")[1]);
    const ITEM_HEIGHT = 44;
    const hoursRef = React.useRef<FlatList>(null);
    const minutesRef = React.useRef<FlatList>(null);
    React.useEffect(() => {
    if (visible) {
      setTimeout(() => {
        const hourY = parseInt(initialTime.split(":")[0] || "0", 10) * ITEM_HEIGHT;
        const minY = parseInt(initialTime.split(":")[1] || "0", 10) * ITEM_HEIGHT;
        hoursRef.current?.scrollToOffset({ offset: hourY, animated: false });
        minutesRef.current?.scrollToOffset({ offset: minY, animated: false });
      }, 100);
    }
    }, [visible, initialTime]);
    const handleScroll = (event: any, setter: (val: string) => void) => {
            const y = event.nativeEvent.contentOffset.y;
            const index = Math.max(0, Math.round(y / ITEM_HEIGHT));
            setter(String(index).padStart(2, "0"));
          };
    return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 24, width: 300 }}>
          <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: colors.ink700, marginBottom: 20 }}>{title}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', height: ITEM_HEIGHT * 3, position: 'relative' }}>
            <View style={{ position: 'absolute', top: ITEM_HEIGHT, left: 10, right: 10, height: ITEM_HEIGHT, backgroundColor: colors.ink100, borderRadius: 12, zIndex: -1 }} />
            
            <FlatList
              ref={hoursRef}
              data={Array.from({length: 24})}
              keyExtractor={(_, i) => String(i)}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, setHours)}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
              initialScrollIndex={parseInt(initialTime.split(":")[0] || "0", 10)}
              onScrollToIndexFailed={(info) => {
                const hourY = parseInt(initialTime.split(":")[0] || "0", 10) * ITEM_HEIGHT;
                setTimeout(() => hoursRef.current?.scrollToOffset({ offset: hourY, animated: false }), 100);
              }}
              getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
              renderItem={({ index: i }) => (
                <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', width: 80 }}>
                  <Text style={{ fontSize: 22, fontWeight: '600', color: String(i).padStart(2, "0") === hours ? colors.brandPurple : colors.ink400 }}>{String(i).padStart(2, "0")}</Text>
                </View>
              )}
            />
            
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.brandPurple }}>:</Text>
            </View>

            <FlatList
              ref={minutesRef}
              data={Array.from({length: 60})}
              keyExtractor={(_, i) => String(i)}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => handleScroll(e, setMinutes)}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
              initialScrollIndex={parseInt(initialTime.split(":")[1] || "0", 10)}
              onScrollToIndexFailed={(info) => {
                const minY = parseInt(initialTime.split(":")[1] || "0", 10) * ITEM_HEIGHT;
                setTimeout(() => minutesRef.current?.scrollToOffset({ offset: minY, animated: false }), 100);
              }}
              getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
              renderItem={({ index: i }) => (
                <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', width: 80 }}>
                  <Text style={{ fontSize: 22, fontWeight: '600', color: String(i).padStart(2, "0") === minutes ? colors.brandPurple : colors.ink400 }}>{String(i).padStart(2, "0")}</Text>
                </View>
              )}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
             <Pressable style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.ink100, alignItems: 'center', justifyContent: 'center' }} onPress={onClose}>
               <Text style={{ color: colors.ink500, fontWeight: '600' }}>Annuler</Text>
             </Pressable>
             <Pressable style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.brandPurple, alignItems: 'center', justifyContent: 'center' }} onPress={() => onConfirm(`${hours}:${minutes}`)}>
               <Text style={{ color: colors.white, fontWeight: '600' }}>Confirmer</Text>
             </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    );
}
