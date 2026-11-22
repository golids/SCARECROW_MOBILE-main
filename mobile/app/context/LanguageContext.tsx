
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "ceb";

const translations = {
  en: {
    // Navigation
    appName: "ScareCROW",
    home: "Home",
    overview: "Overview",
    devices: "Devices",
    detections: "Detections",
    alerts: "Alerts",
    logs: "Logs",
    settings: "Settings",

    // General
    workspace: "WORKSPACE",
    secure: "Secure admin access",
    admin: "Administrator",
    administrator: "Administrator",
    live: "Live database",
    refresh: "Refresh",
    fieldOps: "FIELD OPERATIONS",
    goodDay: "Good day, Administrator",
    loading: "Loading...",
    search: "Search",
    noData: "No data available",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    archive: "Archive",
    active: "Active",
    archived: "Archived",
    online: "Online",
    offline: "Offline",
    Online: "Online",
    event: "Event",
    selected: "Selected",
    viewAll: "View all",
    viewLogs: "View logs",
    yesterday: "Yesterday",
    anyTime: "Anytime",

    // Dashboard
    overviewDesc:
      "Here’s what’s happening across your ScareCROW field devices.",
    registered: "Registered devices",
    registeredNote: "All registered field units",
    heartbeat: "Heartbeat within 30 seconds",
    birdsToday: "Bird detections today",
    todayRecords: "Based on today's records",
    otherEvents: "Other events",
    deviceActivity: "Device and system activity",
    deviceStatus: "Device status",
    liveHeartbeat: "Live heartbeat monitoring",
    recent: "Recent activity",
    latestEvents: "Latest database events",
    noDevices: "No devices found in the database.",
    noActivity: "No activity records yet.",
    statusNote:
      "Device status is calculated from the latest heartbeat.",
    statusNoteEnd:
      "A device is online only when its latest heartbeat is within 30 seconds.",

    // Devices
    registeredTitle: "Registered devices",
    monitorDesc:
      "Monitor each field unit and its most recent heartbeat.",
    deviceInfo:
      "Device information is read from your Supabase database",
    device: "DEVICE",
    location: "LOCATION",
    status: "STATUS",
    lastSeen: "LAST SEEN",
    ipAddress: "IP ADDRESS",
    notSet: "Not set",
    never: "Never connected",
    justNow: "Just now",
    minAgo: "min ago",
    hrAgo: "hr ago",
    daysAgo: "days ago",
    protection:
      "Device creation, archiving, and deletion are intentionally not enabled in this first web build to protect registered field records.",
    unknown: "Unknown device",
    locationMissing: "Location not specified",
    offlineDevices: "Offline devices",
    onlineDevices: "Online devices",

    // Detection and activity logs
    history: "Detection & event history",
    alertsTitle: "Alerts",
    recordsDesc:
      "Records are loaded directly from the database and update when new events arrive.",
    records: "records",
    noMatches: "No matching records found.",
    birdDetected: "Bird detected",
    birdDetectionLogs: "Bird Detection Logs",
    chestnutMunia: "Chestnut Munia",

    // Statistics
    viewStatistics: "View statistics",
    deviceStatistics: "Device Statistics",
    statisticsFor: "Statistics for",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    allTime: "All Time",
    totalEvents: "Total Events",
    eventsRecorded: "Events recorded",
    birdAlerts: "Bird Alerts",
    birdDetections: "Bird detections",
    offlineEvents: "Offline Events",
    connectionEvents: "Connection events",
    detectedToday: "Detected Today",
    birdDetectionsToday: "Bird detections today",
    averagePerDay: "Avg. per Day",
    detectionsPerDay: "Bird detections per day",
    peakTime: "Peak Time",
    mostDetections: "Most detections",
    noStatistics:
      "No statistics available for this device and date range.",
    thisWeek: "This Week",

    // Account
    account: "Administrator account",
    administratorAccount: "Administrator Account",
    signedIn: "Currently signed-in account",
    authenticated: "Authenticated administrator",
    email: "Email address",
    noActiveAccount: "No active account",
    password: "Password",

    // Settings
    systemSettings: "System settings",
    settingsSubtitle:
      "Manage your account and application preferences.",
    settingsDesc:
      "Manage your administrator session and notification preferences.",

    // Notifications
    notifications: "Notification preferences",
    notificationPreferences: "Notification Preferences",
    savedPerAccount: "Saved per administrator account",
    disconnection: "Device disconnection",
    errors: "Device errors",
    lowBattery: "Low battery",
    recovery: "Device recovery",
    birdDetection: "Bird detection",

    deviceDisconnection: "Device Disconnection",
    deviceErrors: "Device Errors",
    deviceRecovery: "Device Recovery",

    deviceDisconnectionDescription:
      "Get notified when a device goes offline.",
    deviceErrorsDescription:
      "Receive alerts when a device encounters an error.",
    lowBatteryDescription:
      "Get notified when a device battery is running low.",
    deviceRecoveryDescription:
      "Know when a disconnected device reconnects.",
    birdDetectionDescription:
      "Receive notifications when birds are detected.",

    chooseScarecrowNotifications:
      "Choose which ScareCROW events you want to receive notifications about.",
    getNotifiedWhenOffline:
      "Get notified when a device goes offline.",
    receiveDeviceErrors:
      "Receive alerts when a device encounters an error.",

    deviceDisconnectionTitle: "Device Disconnection",
    deviceErrorsTitle: "Device Errors",
    lowBatteryTitle: "Low Battery",
    deviceRecoveryTitle: "Device Recovery",
    birdDetectionTitle: "Bird Detection",

    // Language
    language: "Language",
    english: "English",
    cebuano: "Cebuano (Bisaya)",
    availableLanguages: "Available Languages",
    chooseLanguage: "Choose Your Language",
    languageDescription:
      "Select the language you are most comfortable using.",
    languageSaved: "Your language preference has been saved.",
    savingPreference: "Saving preference...",
    languageNote:
      "Your language preference is saved on this device.",
    appLanguage: "App Language",
    languageDesc:
      "Choose the language used throughout the dashboard.",
    choosePreferredLanguage:
      "Choose your preferred language.",

    // Login
    welcome: "Welcome back",
    loginDesc:
      "Sign in to manage your ScareCROW devices.",
    signingIn: "Signing in...",
    signIn: "Sign in",
    existingAccount:
      "Use an existing ScareCROW administrator account.",

    // Supabase
    connect: "Connect your Supabase project",
    connectDesc:
      "Create a .env file in the web project using .env.example, then add your Supabase project URL and publishable/anon key.",
    neverKey:
      "Never use your Supabase service-role key in a browser application.",
    connected: "Connected to Supabase",
    syncing: "Syncing with Supabase...",

    // About
    about: "About",
    smartCropProtectionSystem:
      "Smart Crop Protection System",
    version: "Version",
    footer: "SCARECROW • Smart field monitoring",
    scarecrowAdminApplication:
      "ScareCROW Admin Application",

    // Actions and messages
    logout: "Log Out",
    logOut: "Sign out",
    signOut: "Sign out",
    logoutConfirmation:
      "Are you sure you want to log out of your administrator account?",
    logoutFailed: "Logout Failed",
    error: "Error",
    adminSessionNotFound:
      "Administrator session not found.",
    settingsLoadError:
      "Unable to load settings.",
    notificationUpdateFailed:
      "Unable to save notification preference.",
    
    // Devices screen - additional translations
    monitorDevices: "Monitor and check your registered devices",
    totalDevices: "Total Devices",
    inactive: "Inactive",
    registeredDevices: "Registered Devices",
    found: "found",
    searchDevices: "Search name, location, or IP...",
    all: "All",
    loadingDevices: "Loading registered devices...",
    unnamedDevice: "Unnamed Device",
    archivedDevice: "Archived device",
    notConfigured: "Not configured",
    port: "Port",
    lastHeartbeat: "Last Heartbeat",
    deviceId: "Device ID",
    editDevice: "Edit Device",

    archivedDeviceNotice:
      "This device is archived. You can still edit its registered information without changing its archived status.",
    inactiveDeviceNotice:
      "This device has not sent a heartbeat within the last 30 seconds. Check its power and network connection.",
    protectedDeviceNotice:
      "Protected primary device. Archiving is disabled.",

    noDevicesRegistered: "No Devices Registered",
    noDevicesRegisteredDescription:
      "Registered ScareCROW devices will appear here once they are added to the system.",
    noActiveDevices: "No Active Registered Devices",
    noActiveDevicesDescription:
      "Your devices are currently listed in the Archived Devices section below.",
    noMatchingDevices: "No Matching Devices",
    changeDeviceFilter:
      "Try another search term or change the status filter.",
    clearFilters: "Clear Filters",

    archivedDevices: "Archived Devices",
    noArchivedDevices: "No Archived Devices",
    noMatchingArchivedDevices: "No Matching Archived Devices",
    noArchivedDevicesDescription:
      "Devices that you archive will appear here.",
    noMatchingArchivedDescription:
      "Try a different search term to find an archived device.",

    loadDevicesError:
      "Unable to load devices. Please check your connection and try again.",

    requiredField: "Required Field",
    enterDeviceName: "Please enter the device name.",
    enterDeviceLocation: "Please enter the device location.",
    invalidPort: "Invalid Port",
    validPortMessage:
      "Please enter a valid port number between 1 and 65535.",

    protectedDevice: "Protected Device",
    cannotArchivePrimary:
      "The primary ScareCROW device cannot be archived.",
    archiveDeviceQuestion: "Archive Device?",
    archiveDeviceMessage: "You are about to archive",
    archiveDeviceDescription:
      "This device will no longer appear in your active registered devices.",
    continue: "Continue",
    finalConfirmation: "Final Confirmation",
    confirmArchiveMessage:
      "Are you sure you want to archive",
    adminVerificationRequired:
      "This action requires administrator verification.",
    goBack: "Go Back",
    proceed: "Proceed",

    passwordRequired: "Password Required",
    enterAdminPassword:
      "Please enter your administrator password.",
    unableDeviceAction:
      "Unable to process this device action.",
    deviceOperationFailed:
      "The requested device operation was unsuccessful.",

    deviceUpdated: "Device Updated",
    archivedDeviceUpdated:
      "The archived device information has been successfully updated. Its archived status has been preserved.",
    deviceUpdatedMessage:
      "The device details have been successfully updated.",
    deviceArchived: "Device Archived",
    deviceArchivedMessage:
      "The device has been successfully archived.",
    actionFailed: "Action Failed",
    deviceOperationTryAgain:
      "Unable to complete the device operation. Please try again.",

    editArchivedDevice: "Edit Archived Device",
    editDeviceDescription:
      "Update the registered device information",
    archivedEditNotice:
      "Editing this device will not restore it or remove its archived status.",
    deviceName: "Device Name",
    enterDeviceNamePlaceholder: "Enter device name",
    enterFieldLocation: "Enter field location",
    enterIpAddress: "Enter IP address",
    reviewDeviceChangesNotice:
      "Review the updated device details before confirming your changes.",
    reviewChanges: "Review Changes",
    reviewUpdatedInformation:
      "Please review the updated information before proceeding.",
    archiveStatus: "Archive Status",
    remainsArchived: "Remains Archived",
    confirmEdit: "Confirm Edit",

    adminVerification: "Administrator Verification",
    verifyEditDescription:
      "Enter your administrator password to save the device changes.",
    verifyArchiveDescription:
      "Enter your administrator password to confirm this archive action.",
    enterAdminPasswordPlaceholder:
      "Enter administrator password",
    verifyAndSave: "Verify and Save",
    verifyAndArchive: "Verify and Archive",
    tryAgain: "Try Again",
    deviceStatusExplanation:
      "A device is considered Active when its last heartbeat was received within the last 30 seconds. Archived devices are excluded from active device monitoring.",
        // Log History Screen
    today: "Today",
    earlier: "Earlier",
    deviceOffline: "Device Offline",
    deviceOnline: "Device Online",
    systemEvent: "System Event",
    batteryAlert: "Battery Alert",
    deviceError: "Device Error",
    deviceRecovered: "Device Recovered",
    motionDetected: "Motion Detected",
    unknownDevice: "Unknown Device",
    deviceAlerts: "Device Alerts",
    monitorBirdDetections:
      "Monitor bird detections from your devices",
    monitorDeviceEvents:
      "Monitor device status and system events",
    deviceAlertsToday: "Device Alerts Today",
    allDevices: "All Devices",
    selectedDevice: "Selected Device",
    record: "record",
    showLess: "Show less",
    showAll: "Show all",
    birdDetectionHistory: "Bird Detection History",
    deviceAlertHistory: "Device Alert History",
    result: "result",
    results: "results",
    noRecordsFound: "No Records Found",
    noBirdDetectionRecords:
      "Bird detection records will appear here when your ScareCROW device detects birds.",
    noDeviceAlertRecords:
      "Device alerts will appear here when your devices report an error, status change, or other system event.",
    monitoringSystem: "ScareCROW Monitoring System",
    
  },

  ceb: {
    // Navigation
    appName: "ScareCROW",
    home: "Balay",
    overview: "Kinatibuk-ang Tan-aw",
    devices: "Mga Device",
    detections: "Mga Deteksyon",
    alerts: "Mga Alerto ug Kalihokan",
    logs: "Mga Rekord",
    settings: "Mga Setting",

    // General
    workspace: "LUGAR SA TRABAHO",
    secure: "Luwas nga pag-access sa admin",
    admin: "Administrator",
    administrator: "Administrator",
    live: "Live nga database",
    refresh: "I-refresh",
    fieldOps: "OPERASYON SA UMAHAN",
    goodDay: "Maayong adlaw, Administrator",
    loading: "Nag-load...",
    search: "Pangita",
    noData: "Walay datos nga makita",
    cancel: "Kanselahon",
    save: "I-save",
    delete: "Tangtangon",
    edit: "Usbon",
    archive: "I-archive",
    active: "Aktibo",
    archived: "Gi-archive",
    online: "Online",
    offline: "Offline",
    Online: "Online",
    event: "Panghitabo",
    selected: "Napili",
    viewAll: "Tan-awa tanan",
    viewLogs: "Tan-awa ang mga rekord",
    yesterday: "Kagahapon",
    anyTime: "Bisan unsang Oras",

    // Dashboard
    overviewDesc:
      "Mao kini ang kahimtang sa imong mga ScareCROW device sa umahan.",
    registered: "Mga rehistradong device",
    registeredNote:
      "Tanang rehistradong device sa umahan",
    heartbeat: "Heartbeat sulod sa 30 segundos",
    birdsToday:
      "Mga langgam nga nakita karong adlawa",
    todayRecords:
      "Base sa mga rekord karong adlawa",
    otherEvents: "Uban pang panghitabo",
    deviceActivity: "Kalihokan sa device ug sistema",
    deviceStatus: "Kahimtang sa device",
    liveHeartbeat:
      "Live nga pagsubay sa heartbeat",
    recent: "Bag-ong kalihokan",
    latestEvents:
      "Pinakabag-ong mga panghitabo sa database",
    noDevices: "Walay nakitang device sa database.",
    noActivity: "Wala pay mga rekord sa kalihokan.",
    statusNote:
      "Ang kahimtang sa device gibase sa pinakabag-ong heartbeat.",
    statusNoteEnd:
      "Online lang ang device kung ang pinakabag-ong heartbeat niini naa sulod sa 30 segundos.",

    // Devices
    registeredTitle: "Mga rehistradong device",
    monitorDesc:
      "Bantayi ang matag device sa umahan ug ang pinakabag-ong heartbeat.",
    deviceInfo:
      "Ang impormasyon sa device gikan sa imong Supabase database",
    device: "DEVICE",
    location: "LOKASYON",
    status: "KAHIMTANG",
    lastSeen: "KATAPUSANG NAKITA",
    ipAddress: "IP ADDRESS",
    notSet: "Wala gibutang",
    never: "Wala pa nakakonekta",
    justNow: "Bag-o lang",
    minAgo: "min ang milabay",
    hrAgo: "oras ang milabay",
    daysAgo: "adlaw ang milabay",
    protection:
      "Wala pa gi-enable ang paghimo, pag-archive, ug pagtangtang sa device niining unang web version aron mapanalipdan ang mga rekord.",
    unknown: "Wala mailhing device",
    locationMissing: "Walay gibutang nga lokasyon",
    offlineDevices: "Mga offline nga device",
    onlineDevices: "Mga online nga device",

    // Detection and activity logs
    history: "Kasaysayan sa detection ug panghitabo",
    alertsTitle: "Mga alerto ug kalihokan",
    recordsDesc:
      "Direktang gikuha ang mga rekord gikan sa database ug awtomatikong ma-update kung naay bag-ong panghitabo.",
    records: "ka rekord",
    noMatches: "Walay nakitang katugbang nga rekord.",
    birdDetected: "Nakit-an nga langgam",
    birdDetectionLogs:
      "Mga Rekord sa Pag-detect og Langgam",
    chestnutMunia: "Mayang Pula",

    // Statistics
    viewStatistics: "Tan-awa ang estadistika",
    deviceStatistics: "Estadistika sa Device",
    statisticsFor: "Estadistika para sa",
    last7Days: "Miaging 7 ka Adlaw",
    last30Days: "Miaging 30 ka Adlaw",
    allTime: "Tanan nga Panahon",
    totalEvents: "Kinatibuk-ang Panghitabo",
    eventsRecorded: "Mga natala nga panghitabo",
    birdAlerts: "Mga Alerto sa Langgam",
    birdDetections: "Mga nadetect nga langgam",
    offlineEvents: "Mga Offline nga Panghitabo",
    connectionEvents: "Mga panghitabo sa koneksyon",
    detectedToday: "Nadetect Karong Adlawa",
    birdDetectionsToday:
      "Mga langgam nga nadetect karong adlawa",
    averagePerDay: "Kasagaran Kada Adlaw",
    detectionsPerDay:
      "Mga nadetect nga langgam kada adlaw",
    peakTime: "Oras nga Pinakadaghan",
    mostDetections: "Pinakadaghan nga detection",
    noStatistics:
      "Walay estadistika alang niini nga device ug panahon.",
    thisWeek: "Karong Semanaha",

    // Account
    account: "Admin account",
    administratorAccount: "Account sa Administrator",
    signedIn: "Karon naka-sign in nga account",
    authenticated:
      "Authenticated nga administrator",
    email: "Email address",
    noActiveAccount: "Walay aktibong account",
    password: "Password",

    // Settings
    systemSettings: "Mga setting sa sistema",
    settingsSubtitle:
      "Pagdumala sa imong account ug mga setting sa aplikasyon.",
    settingsDesc:
      "Pagdumala sa imong admin session ug mga pahibalo.",

    // Notifications
    notifications: "Mga pahibalo",
    notificationPreferences: "Mga Pahibalo",
    savedPerAccount:
      "Gitipigan para sa matag admin account",
    disconnection:
      "Naputol ang koneksyon sa device",
    errors: "Mga sayop sa device",
    lowBattery: "Hina ang baterya",
    recovery: "Nabalik ang koneksyon sa device",
    birdDetection: "Nakit-an nga langgam",

    deviceDisconnection:
      "Pagkawala sa Koneksyon",
    deviceErrors: "Mga Sayop sa Device",
    deviceRecovery: "Pagbalik sa Koneksyon",

    deviceDisconnectionDescription:
      "Pahibal-a kung mawala ang koneksyon sa device.",
    deviceErrorsDescription:
      "Pahibal-a kung adunay sayop sa device.",
    lowBatteryDescription:
      "Pahibal-a kung hapit na mahurot ang baterya.",
    deviceRecoveryDescription:
      "Pahibal-a kung mobalik ang koneksyon sa device.",
    birdDetectionDescription:
      "Pahibal-a kung adunay langgam nga na-detect.",

    chooseScarecrowNotifications:
      "Pilia kung unsang mga panghitabo sa ScareCROW ang gusto nimong pahibaloan.",
    getNotifiedWhenOffline:
      "Makadawat og pahibalo kung ma-offline ang device.",
    receiveDeviceErrors:
      "Makadawat og pahibalo kung adunay sayop ang device.",

    deviceDisconnectionTitle:
      "Pagkawala sa Koneksyon sa Device",
    deviceErrorsTitle: "Mga Sayop sa Device",
    lowBatteryTitle: "Huyang nga Baterya",
    deviceRecoveryTitle:
      "Pagkakonektar Pag-usab sa Device",
    birdDetectionTitle: "Pag-detect og Langgam",

    // Language
    language: "Pinulongan",
    english: "English",
    cebuano: "Cebuano (Bisaya)",
    availableLanguages:
      "Mga Pinulongan nga Anaa",
    chooseLanguage: "Pilia ang Imong Pinulongan",
    languageDescription:
      "Pilia ang pinulongan nga komportable kang gamiton.",
    languageSaved:
      "Na-save na ang imong pinulongan.",
    savingPreference:
      "Gina-save ang pinulongan...",
    languageNote:
      "Na-save ang imong pinulongan niini nga device.",
    appLanguage: "Pinulongan sa App",
    languageDesc:
      "Pilia ang pinulongan nga gamiton sa dashboard.",
    choosePreferredLanguage:
      "Pilia ang imong gustong pinulongan.",

    // Login
    welcome: "Maayong pagbalik",
    loginDesc:
      "Pag-sign in aron madumala ang imong mga ScareCROW device.",
    signingIn: "Nag-sign in...",
    signIn: "Sign in",
    existingAccount:
      "Gamita ang kasamtangang ScareCROW administrator account.",

    // Supabase
    connect: "Ikonekta ang imong Supabase project",
    connectDesc:
      "Paghimo og .env file sa web project gamit ang .env.example, dayon ibutang ang Supabase project URL ug publishable/anon key.",
    neverKey:
      "Ayaw gamita ang Supabase service-role key sa browser application.",
    connected: "Nakakonekta sa Supabase",
    syncing: "Nag-sync sa Supabase...",

    // About
    about: "Mahitungod",
    smartCropProtectionSystem:
      "Smart nga Sistema sa Proteksyon sa Tanom",
    version: "Bersyon",
    footer:
      "SCARECROW • Smart nga pagsubay sa umahan",
    scarecrowAdminApplication:
      "ScareCROW nga Aplikasyon sa Administrador",

    // Actions and messages
    logout: "Paggawas",
    logOut: "Gawas",
    signOut: "Gawas sa account",
    logoutConfirmation:
      "Sigurado ka nga gusto nimong mogawas sa imong administrator account?",
    logoutFailed: "Napakyas ang Pag-logout",
    error: "Sayop",
    adminSessionNotFound:
      "Wala makit-i ang sesyon sa administrador.",
    settingsLoadError:
      "Dili ma-load ang mga setting.",
    notificationUpdateFailed:
      "Dili ma-save ang gusto nga pahibalo.",
    
    // Devices screen - additional translations
    monitorDevices:
      "Bantayi ug susiha ang imong mga rehistradong device",
    totalDevices: "Kinatibuk-ang Device",
    inactive: "Dili Aktibo",
    registeredDevices: "Mga Rehistradong Device",
    found: "nakit-an",
    searchDevices: "Pangitaa ang ngalan, lokasyon, o IP...",
    all: "Tanan",
    loadingDevices: "Nag-load sa mga rehistradong device...",
    unnamedDevice: "Walay Ngalan nga Device",
    archivedDevice: "Gi-archive nga device",
    notConfigured: "Wala ma-configure",
    port: "Port",
    lastHeartbeat: "Kataposang Heartbeat",
    deviceId: "Device ID",
    editDevice: "Usba ang Device",

    archivedDeviceNotice:
      "Gi-archive kini nga device. Mahimo gihapon nimong usbon ang impormasyon niini nga dili mausab ang archived status.",
    inactiveDeviceNotice:
      "Wala nakapadala og heartbeat ang device sulod sa kataposang 30 segundos. Susiha ang power ug koneksyon sa network.",
    protectedDeviceNotice:
      "Pangunang device nga protektado. Dili kini mahimong i-archive.",

    noDevicesRegistered: "Walay Rehistradong Device",
    noDevicesRegisteredDescription:
      "Mopakita dinhi ang mga rehistradong ScareCROW device kon maapil na kini sa sistema.",
    noActiveDevices: "Walay Aktibong Rehistradong Device",
    noActiveDevicesDescription:
      "Ang imong mga device anaa karon sa seksyon sa Gi-archive nga mga Device sa ubos.",
    noMatchingDevices: "Walay Nahiangay nga Device",
    changeDeviceFilter:
      "Sulayi ang laing pulong sa pagpangita o usba ang status filter.",
    clearFilters: "Tangtanga ang mga Filter",

    archivedDevices: "Mga Gi-archive nga Device",
    noArchivedDevices: "Walay Gi-archive nga Device",
    noMatchingArchivedDevices:
      "Walay Nahiangay nga Gi-archive nga Device",
    noArchivedDevicesDescription:
      "Mopakita dinhi ang mga device nga imong i-archive.",
    noMatchingArchivedDescription:
      "Sulayi ang laing pulong sa pagpangita aron makakita og gi-archive nga device.",

    loadDevicesError:
      "Dili ma-load ang mga device. Susiha ang imong koneksyon ug sulayi pag-usab.",

    requiredField: "Kinahanglan Kini nga Field",
    enterDeviceName: "Palihog isulod ang ngalan sa device.",
    enterDeviceLocation: "Palihog isulod ang lokasyon sa device.",
    invalidPort: "Dili Balidong Port",
    validPortMessage:
      "Palihog isulod ang balidong port number tali sa 1 ug 65535.",

    protectedDevice: "Protektadong Device",
    cannotArchivePrimary:
      "Dili mahimong i-archive ang pangunang ScareCROW device.",
    archiveDeviceQuestion: "I-archive ang Device?",
    archiveDeviceMessage: "Imong i-archive ang",
    archiveDeviceDescription:
      "Dili na kini makita sa imong aktibong mga rehistradong device.",
    continue: "Padayon",
    finalConfirmation: "Kataposang Kumpirmasyon",
    confirmArchiveMessage:
      "Sigurado ka nga gusto nimong i-archive ang",
    adminVerificationRequired:
      "Kinahanglan ang pag-verify sa administrator alang niini nga aksyon.",
    goBack: "Balik",
    proceed: "Padayon",

    passwordRequired: "Kinahanglan ang Password",
    enterAdminPassword:
      "Palihog isulod ang imong administrator password.",
    unableDeviceAction:
      "Dili maproseso ang aksyon alang niini nga device.",
    deviceOperationFailed:
      "Napakyas ang gihangyo nga operasyon sa device.",

    deviceUpdated: "Na-update ang Device",
    archivedDeviceUpdated:
      "Malampusong na-update ang impormasyon sa gi-archive nga device. Gipabilin ang archived status niini.",
    deviceUpdatedMessage:
      "Malampusong na-update ang mga detalye sa device.",
    deviceArchived: "Na-archive ang Device",
    deviceArchivedMessage:
      "Malampusong na-archive ang device.",
    actionFailed: "Napakyas ang Aksyon",
    deviceOperationTryAgain:
      "Dili makompleto ang operasyon sa device. Palihog sulayi pag-usab.",

    editArchivedDevice: "Usba ang Gi-archive nga Device",
    editDeviceDescription:
      "I-update ang rehistradong impormasyon sa device",
    archivedEditNotice:
      "Ang pag-usab niini nga device dili mo-restore niini o motangtang sa archived status niini.",
    deviceName: "Ngalan sa Device",
    enterDeviceNamePlaceholder:
      "Isulod ang ngalan sa device",
    enterFieldLocation: "Isulod ang lokasyon sa uma",
    enterIpAddress: "Isulod ang IP address",
    reviewDeviceChangesNotice:
      "Susiha ang gi-update nga mga detalye sa device sa dili pa kumpirmahon ang imong mga kausaban.",
    reviewChanges: "Susiha ang mga Kausaban",
    reviewUpdatedInformation:
      "Palihog susiha ang gi-update nga impormasyon sa dili pa mopadayon.",
    archiveStatus: "Archive Status",
    remainsArchived: "Magpabiling Gi-archive",
    confirmEdit: "Kumpirmaha ang Pag-usab",

    adminVerification: "Pag-verify sa Administrator",
    verifyEditDescription:
      "Isulod ang imong administrator password aron ma-save ang mga kausaban sa device.",
    verifyArchiveDescription:
      "Isulod ang imong administrator password aron makumpirma ang pag-archive niini.",
    enterAdminPasswordPlaceholder:
      "Isulod ang administrator password",
    verifyAndSave: "I-verify ug I-save",
    verifyAndArchive: "I-verify ug I-archive",
    tryAgain: "Sulayi Pag-usab",
    deviceStatusExplanation:
      "Giisip nga Aktibo ang device kon nadawat ang kataposang heartbeat sulod sa 30 segundos. Ang mga gi-archive nga device dili apil sa aktibong pagmonitor.",
        // Log History Screen
    today: "Karong Adlawa",
    earlier: "Kaniadto",
    deviceOffline: "Walay Koneksyon ang Device",
    deviceOnline: "Aktibo ang Device",
    systemEvent: "Hitabo sa Sistema",
    batteryAlert: "Pahimangno sa Baterya",
    deviceError: "Sayop sa Device",
    deviceRecovered: "Nabalik ang Device",
    motionDetected: "Nakit-an ang Paglihok",
    unknownDevice: "Wala Mailhing Device",
    deviceAlerts: "Mga Pahimangno sa Device",
    monitorBirdDetections:
      "Bantayi ang mga langgam nga nakit-an sa imong mga device",
    monitorDeviceEvents:
      "Bantayi ang kahimtang sa device ug mga hitabo sa sistema",
    deviceAlertsToday: "Mga Pahimangno sa Device Karong Adlawa",
    allDevices: "Tanang Device",
    selectedDevice: "Napiling Device",
    record: "rekord",
    showLess: "Ipakita ang gamay",
    showAll: "Ipakita ang tanan",
    birdDetectionHistory: "Kasaysayan sa mga Nakit-ang Langgam",
    deviceAlertHistory: "Kasaysayan sa mga Pahimangno sa Device",
    result: "resulta",
    results: "mga resulta",
    noRecordsFound: "Walay Nakaplagang Rekord",
    noBirdDetectionRecords:
      "Dinhi makita ang mga rekord kung makakita og langgam ang imong ScareCROW device.",
    noDeviceAlertRecords:
      "Dinhi makita ang mga pahimangno kung adunay sayop, pagbag-o sa kahimtang, o laing hitabo sa imong mga device.",
    monitoringSystem: "ScareCROW Monitoring System",
  },
};

export type TranslationKey = keyof typeof translations.en;

type LanguageContextType = {
  language: Language;
  changeLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey) => string;
  isLanguageReady: boolean;
};

const LanguageContext = createContext<
  LanguageContextType | undefined
>(undefined);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>("en");
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(
          "scarecrow-language"
        );

        if (savedLanguage === "en" || savedLanguage === "ceb") {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Unable to load saved language:", error);
      } finally {
        setIsLanguageReady(true);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = useCallback(
    async (newLanguage: Language) => {
      try {
        await AsyncStorage.setItem(
          "scarecrow-language",
          newLanguage
        );
        setLanguage(newLanguage);
      } catch (error) {
        console.error("Unable to save language:", error);
        throw error;
      }
    },
    []
  );

  const t = useCallback(
    (key: TranslationKey): string => translations[language][key],
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        t,
        isLanguageReady,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside a LanguageProvider."
    );
  }

  return context;
}