import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "src/services/api";
import { colors, softShadow } from "../theme/theme";
import { TimePickerModal } from "./TimePickerModal";
import { FarmHiveItem } from "../../shared/types/types";

export function FarmPlanTab({ farmId, hives, onStart, onDelete }: { farmId: string; hives: FarmHiveItem[]; onStart: () => void; onDelete: () => void }) {
    const [mode, setMode] = useState<"Planifié" | "Manuel">("Planifié");
    const calendarDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const dates = useMemo(() => {
            const year = currentMonthDate.getFullYear();
            const month = currentMonthDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            let startDayIndex = firstDay === 0 ? 6 : firstDay - 1;
            
            const grid: string[][] = [];
            let week: string[] = Array(startDayIndex).fill("");
            let currentDay = 1;
            
            while (currentDay <= daysInMonth) {
              week.push(String(currentDay));
              if (week.length === 7) {
                grid.push(week);
                week = [];
              }
              currentDay++;
            }
            if (week.length > 0) {
              while (week.length < 7) week.push("");
              grid.push(week);
            }
            return grid;
          }, [currentMonthDate]);
    const [selectedDate, setSelectedDate] = useState(String(new Date().getDate()));
    const [startTime, setStartTime] = useState("08:40");
    const [endTime, setEndTime] = useState("09:40");
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<"start" | "end">("start");
    const [sessions, setSessions] = useState<{id: string; date: string; time: string}[]>([]);
    const [isManualActive, setIsManualActive] = useState(false);
    const [manualSeconds, setManualSeconds] = useState(0);
    const [manualStartStamp, setManualStartStamp] = useState<Date | null>(null);
    const manualIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
    if (isManualActive) {
      manualIntervalRef.current = setInterval(() => {
        setManualSeconds(s => s + 1);
      }, 1000);
    } else if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
    }
    return () => {
      if (manualIntervalRef.current) clearInterval(manualIntervalRef.current);
    };
    }, [isManualActive]);

    function handleToggleManual() {
        if (!isManualActive) {
          setIsManualActive(true);
          setManualSeconds(0);
          setManualStartStamp(new Date());
        } else {
          setIsManualActive(false);
          if (manualStartStamp) {
            const endStamp = new Date();
            const startString = `${String(manualStartStamp.getHours()).padStart(2, '0')}:${String(manualStartStamp.getMinutes()).padStart(2, '0')}`;
            const endString = `${String(endStamp.getHours()).padStart(2, '0')}:${String(endStamp.getMinutes()).padStart(2, '0')}`;
            
            const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
            const realDayName = dayNames[endStamp.getDay()];
            const realPaddedDate = String(endStamp.getDate()).padStart(2, '0');
            const realPaddedMonth = String(endStamp.getMonth() + 1).padStart(2, '0');
            
            const sessionPayload = { 
              farmId, 
              date: `${realDayName} ${realPaddedDate}/${realPaddedMonth}`, 
              time: `${startString} - ${endString}` 
            };

            api.post("/mobile/sessions", sessionPayload)
              .then(res => {
                const updated = [...sessions, res.data];
                setSessions(updated);
                AsyncStorage.setItem(`mock_sessions_${farmId}`, JSON.stringify(updated)).catch(() => {});
              })
              .catch(async () => {
                const fakeData = { id: Math.random().toString(), ...sessionPayload };
                const updated = [...sessions, fakeData];
                setSessions(updated);
                await AsyncStorage.setItem(`mock_sessions_${farmId}`, JSON.stringify(updated));
              });
          }
        }
    }

    useEffect(() => {
    if (!farmId) return;
    api.get(`/mobile/sessions?farmId=${farmId}`)
      .then(res => setSessions(res.data))
      .catch(async err => {
        try {
          const stored = await AsyncStorage.getItem(`mock_sessions_${farmId}`);
          if (stored) {
            setSessions(JSON.parse(stored));
          } else {
            const defaults = [
              { id: "s1", date: "Lun 12/06", time: "09:40" },
              { id: "s2", date: "Jeu 15/06", time: "09:40" }
            ];
            setSessions(defaults);
            await AsyncStorage.setItem(`mock_sessions_${farmId}`, JSON.stringify(defaults));
          }
        } catch(e) {}
      });
    }, [farmId]);

    function handleAddSession() {
        const realDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), parseInt(selectedDate));
        const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        const dayName = dayNames[realDate.getDay()];
        const paddedDate = selectedDate.padStart(2, "0");
        const realPaddedMonth = String(realDate.getMonth() + 1).padStart(2, '0');
        const newSession = { id: Math.random().toString(), farmId, date: `${dayName} ${paddedDate}/${realPaddedMonth}`, time: startTime };
        api.post(`/mobile/sessions`, newSession)
        .then(res => setSessions([...sessions, res.data]))
        .catch(async err => {
        const updated = [...sessions, newSession];
        setSessions(updated);
        await AsyncStorage.setItem(`mock_sessions_${farmId}`, JSON.stringify(updated));
        });
    }

    function handleDeleteSession(id: string) {
        api.delete(`/mobile/sessions?id=${id}&farmId=${farmId}`)
        .then(() => {
        setSessions(sessions.filter(s => s.id !== id));
        // Remove from AsyncStorage as well to keep it in sync for offline
        const updated = sessions.filter(s => s.id !== id);
        AsyncStorage.setItem(`mock_sessions_${farmId}`, JSON.stringify(updated)).catch(() => {});
        })
        .catch(async err => {
        const updated = sessions.filter(s => s.id !== id);
        setSessions(updated);
        await AsyncStorage.setItem(`mock_sessions_${farmId}`, JSON.stringify(updated));
        });
    }

    return (
    <View style={[styles.farmTabContent, { gap: 16 }]}>
      {pickerVisible && (
        <TimePickerModal 
          visible={true}
          title={pickerTarget === "start" ? "Heure de debut" : "Heure de fin"}
          initialTime={pickerTarget === "start" ? startTime : endTime}
          onConfirm={(t) => {
            if (pickerTarget === "start") setStartTime(t);
            else setEndTime(t);
            setPickerVisible(false);
          }}
          onClose={() => setPickerVisible(false)}
        />
      )}

      <Text style={[styles.designCollectorTitle, { textAlign: "center", color: colors.ink400, marginTop: 8 }]}>PLANIFICATION DU COLLECTEUR</Text>
      
      <View style={styles.farmPlanModeRow}>
        {(["Planifié", "Manuel"] as const).map((item) => { 
          const active = mode === item; 
          return (
            <Pressable key={item} style={[styles.farmPlanMode, active && styles.farmPlanModeActive]} onPress={() => setMode(item)}>
              <Ionicons name={item === "Planifié" ? "calendar-outline" : "settings-outline"} size={26} color={active ? "#808EE7" : colors.ink400} />
              <Text style={[styles.farmPlanModeText, active && styles.farmPlanModeTextActive]}>{item}</Text>
            </Pressable>
          ); 
        })}
      </View>

      <View style={styles.farmPlanCard}>
        {mode === "Planifié" ? (
          <>
            <View style={styles.calendarHeader}>
              <Pressable style={styles.calendarNavBtn} onPress={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={16} color={colors.white} />
              </Pressable>
              <Text style={styles.calendarTitle}>
                {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentMonthDate).replace(/^\w/, c => c.toUpperCase())}
              </Text>
              <Pressable style={styles.calendarNavBtn} onPress={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={16} color={colors.white} />
              </Pressable>
            </View>
            
            <View style={styles.calendarGrid}>
              <View style={styles.calendarRow}>
                {calendarDays.map((d) => <Text key={d} style={styles.calendarDayHeader}>{d}</Text>)}
              </View>
              {dates.map((row, i) => (
                <View key={i} style={styles.calendarRow}>
                  {row.map((d, j) => {
                    const isOrange = d === "9" || d === "29";
                    const isBlue = d === selectedDate && d !== "";
                    return (
                      <Pressable 
                        key={j} 
                        style={[styles.calendarCell, isOrange && styles.calendarCellOrange, isBlue && styles.calendarCellBlue]}
                        onPress={() => { if (d) setSelectedDate(d); }}
                      >
                        <Text style={[styles.calendarCellText, (isOrange || isBlue) && { color: colors.white }]}>{d}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={{ gap: 12, marginTop: 12 }}>
              <View style={styles.timePickerRow}>
                <Text style={styles.timePickerLabel}>Début</Text>
                <Pressable style={styles.timePickerBadge} onPress={() => { setPickerTarget("start"); setPickerVisible(true); }}>
                  <Text style={styles.timePickerText}>{startTime}</Text>
                  <View style={styles.timePickerArrowBox}>
                     <Ionicons name="chevron-down" size={14} color="#808EE7" />
                  </View>
                </Pressable>
              </View>
              <View style={styles.timePickerRow}>
                <Text style={styles.timePickerLabel}>Fin</Text>
                <Pressable style={styles.timePickerBadge} onPress={() => { setPickerTarget("end"); setPickerVisible(true); }}>
                  <Text style={styles.timePickerText}>{endTime}</Text>
                  <View style={styles.timePickerArrowBox}>
                     <Ionicons name="chevron-down" size={14} color="#808EE7" />
                  </View>
                </Pressable>
              </View>
            </View>

            <Pressable style={styles.addSessionBtn} onPress={handleAddSession}>
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              <Text style={styles.addSessionBtnText}>Ajouter une session</Text>
            </Pressable>
          </>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={[styles.farmManualCard, { backgroundColor: "#E3E7FB", padding: 16, borderRadius: 12 }]}>
              <Text style={[styles.farmSystemTitle, { color: colors.brandPurple, marginBottom: 4 }]}>Activation manuelle</Text>
              <Text style={{ color: "#7B86DF", fontSize: 13, lineHeight: 18 }}>Le collecteur sera active immediatement jusqu'a desactivation manuelle. Duree max recommandee : 45 min.</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", height: 80, borderRadius: 12, borderWidth: 2, borderColor: "#808EE7", backgroundColor: colors.white }}>
              <Ionicons name="timer-outline" size={32} color="#808EE7" style={{ marginRight: 24 }} />
              <Text style={{ fontSize: 36, fontWeight: "bold", color: "#808EE7" }}>
                {String(Math.floor(manualSeconds / 60)).padStart(2, '0')}:{String(manualSeconds % 60).padStart(2, '0')}
              </Text>
            </View>
            <Pressable 
              style={[styles.addSessionBtn, isManualActive ? { backgroundColor: "#FF8C00" } : { backgroundColor: colors.brandPurple }]} 
              onPress={handleToggleManual}
            >
              <Text style={styles.addSessionBtnText}>{isManualActive ? "Desactive maintenant" : "Activer maintenant"}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {sessions.length > 0 && <Text style={[styles.designCollectorTitle, { marginTop: 4, fontSize: 13, textTransform: "none", color: colors.ink400 }]}>session planifié</Text>}
      
      {sessions.map((s) => (
        <View key={s.id} style={styles.farmSessionCard}>
          <Ionicons name="calendar-outline" size={18} color={colors.ink400} />
          <Text style={styles.sessionDateText}>{s.date}</Text>
          <Ionicons name="time-outline" size={18} color={colors.ink400} style={{ marginLeft: 8 }} />
          <Text style={styles.sessionDateText}>{s.time}</Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.sessionCloseBtn} onPress={() => handleDeleteSession(s.id)}>
            <Ionicons name="close" size={16} color="#808EE7" />
          </Pressable>
        </View>
      ))}
    </View>
    );
}

const styles = StyleSheet.create({
  farmTabContent: { gap: 12 },
  designCollectorTitle: { color: colors.ink400, fontSize: 18, fontWeight: "600", textTransform: "uppercase" },
  farmPlanModeRow: { flexDirection: "row", gap: 12, marginHorizontal: 4 },
  farmPlanMode: { flex: 1, minHeight: 85, borderRadius: 24, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", gap: 8, ...softShadow },
  farmPlanModeActive: { borderWidth: 2, borderColor: "#808EE7" },
  farmPlanModeText: { color: colors.ink500, fontSize: 13, fontWeight: "500" },
  farmPlanModeTextActive: { color: "#808EE7", fontWeight: "600" },
  farmPlanCard: { borderRadius: 24, backgroundColor: colors.white, padding: 20, ...softShadow },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, marginTop: 4 },
  calendarNavBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#808EE7", alignItems: "center", justifyContent: "center" },
  calendarTitle: { color: colors.ink700, fontSize: 15, fontWeight: "700" },
  calendarGrid: { gap: 14 },
  calendarRow: { flexDirection: "row", justifyContent: "space-between" },
  calendarDayHeader: { width: 32, textAlign: "center", color: colors.ink500, fontSize: 13, fontWeight: "500" },
  calendarCell: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  calendarCellOrange: { backgroundColor: colors.brandOrange },
  calendarCellBlue: { backgroundColor: "#808EE7" },
  calendarCellText: { color: colors.ink700, fontSize: 14, fontWeight: "400" },
  timePickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timePickerLabel: { color: colors.ink500, fontSize: 14, fontWeight: "500" },
  timePickerBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#808EE7", borderRadius: 8, paddingLeft: 12, paddingRight: 4, paddingVertical: 4, gap: 8 },
  timePickerText: { color: colors.white, fontSize: 14, fontWeight: "500" },
  timePickerArrowBox: { backgroundColor: colors.white, borderRadius: 4, padding: 2 },
  addSessionBtn: { backgroundColor: "#808EE7", borderRadius: 24, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 },
  addSessionBtnText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  farmManualCard: {
        borderWidth: 1,
        borderColor: "rgba(128,142,231,0.22)",
      },
  farmSystemTitle: { color: colors.ink800, fontSize: 13, fontWeight: "900" },
  farmSessionCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, ...softShadow, marginHorizontal: 4 },
  sessionDateText: { color: colors.ink700, fontSize: 13, fontWeight: "600", marginLeft: 6 },
  sessionCloseBtn: { backgroundColor: "#EBEFFF", borderRadius: 6, padding: 4 },
});

