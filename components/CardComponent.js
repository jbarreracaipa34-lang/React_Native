import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CardComponent({ title, description, icon }) {
    return (
        <TouchableOpacity style={styles.card}>
            <View style={styles.iconoContainer}>
                <Ionicons name={icon} size={32} color="#1976D2" />
            </View>
            <View style={styles.textoContainer}>
                <Text style={styles.titulo}>{title}</Text>
                <Text style={styles.descripcion}>{description}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "100%",
        alignItems: "center",
        backgroundColor: "#ffffffff",
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        elevation: 3,
        boxShadowColor: "#000",
        boxShadowOpacity: 0.1,
        boxShadowOffset: { width: 0, height: 2 },
        boxShadowRadius: 4,
    },

    iconoContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#E3F2FD",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },

    textoContainer: {
        flex: 1,
        alignItems: "center",
    },

    titulo: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#1976D2",
    },

    descripcion: {
        fontSize: 14,
        color: "#555",
    },

});