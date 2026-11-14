import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/clock/presentation/clock_detail_screen.dart';
import '../../features/calendar/presentation/calendar_month_screen.dart';
import '../../features/calendar/presentation/calendar_week_screen.dart';
import '../../features/calendar/presentation/calendar_agenda_screen.dart';
import '../../features/calendar/presentation/create_event_screen.dart';
import '../../features/calendar/presentation/event_detail_screen.dart';
import '../../features/alarms/presentation/alarm_list_screen.dart';
import '../../features/alarms/presentation/create_alarm_screen.dart';
import '../../features/alarms/presentation/edit_alarm_screen.dart';
import '../../features/alarms/presentation/alarm_detail_screen.dart';
import '../../features/reminders/presentation/reminder_list_screen.dart';
import '../../features/reminders/presentation/create_reminder_screen.dart';
import '../../features/reminders/presentation/reminder_detail_screen.dart';
import '../../features/device/presentation/device_dashboard_screen.dart';
import '../../features/device/presentation/device_discovery_screen.dart';
import '../../features/device/presentation/device_pairing_screen.dart';
import '../../features/device/presentation/device_diagnostics_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/settings/presentation/notification_settings_screen.dart';
import '../../features/settings/presentation/appearance_settings_screen.dart';
import '../../shared/widgets/bottom_nav_bar.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        int index = 0;
        final loc = state.matchedLocation;
        if (loc.startsWith('/calendar')) {
          index = 1;
        } else if (loc.startsWith('/alarms')) {
          index = 2;
        } else if (loc.startsWith('/device')) {
          index = 3;
        } else if (loc.startsWith('/settings')) {
          index = 4;
        }

        return Scaffold(
          body: child,
          bottomNavigationBar: BottomNavBar(
            currentIndex: index,
            onTap: (newIdx) {
              switch (newIdx) {
                case 0:
                  context.go('/');
                  break;
                case 1:
                  context.go('/calendar');
                  break;
                case 2:
                  context.go('/alarms');
                  break;
                case 3:
                  context.go('/device');
                  break;
                case 4:
                  context.go('/settings');
                  break;
              }
            },
          ),
        );
      },
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/calendar',
          builder: (context, state) => const CalendarMonthScreen(),
        ),
        GoRoute(
          path: '/alarms',
          builder: (context, state) => const AlarmListScreen(),
        ),
        GoRoute(
          path: '/device',
          builder: (context, state) => const DeviceDashboardScreen(),
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
    // Dedicated Push Routes
    GoRoute(
      path: '/clock',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ClockDetailScreen(),
    ),
    GoRoute(
      path: '/calendar/week',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CalendarWeekScreen(),
    ),
    GoRoute(
      path: '/calendar/agenda',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CalendarAgendaScreen(),
    ),
    GoRoute(
      path: '/calendar/create-event',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CreateEventScreen(),
    ),
    GoRoute(
      path: '/calendar/events/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return EventDetailScreen(eventId: id);
      },
    ),
    GoRoute(
      path: '/alarms/create',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CreateAlarmScreen(),
    ),
    GoRoute(
      path: '/alarms/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return AlarmDetailScreen(alarmId: id);
      },
    ),
    GoRoute(
      path: '/alarms/:id/edit',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return EditAlarmScreen(alarmId: id);
      },
    ),
    GoRoute(
      path: '/reminders',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const ReminderListScreen(),
    ),
    GoRoute(
      path: '/reminders/create',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CreateReminderScreen(),
    ),
    GoRoute(
      path: '/reminders/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return ReminderDetailScreen(reminderId: id);
      },
    ),
    GoRoute(
      path: '/device/discovery',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const DeviceDiscoveryScreen(),
    ),
    GoRoute(
      path: '/device/pairing',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.uri.queryParameters['id'] ?? 'ESP32-CLK-4A2F';
        final name = state.uri.queryParameters['name'] ?? 'Smart Clock';
        return DevicePairingScreen(deviceId: id, deviceName: name);
      },
    ),
    GoRoute(
      path: '/diagnostics',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const DeviceDiagnosticsScreen(),
    ),
    GoRoute(
      path: '/settings/notifications',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const NotificationSettingsScreen(),
    ),
    GoRoute(
      path: '/settings/appearance',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const AppearanceSettingsScreen(),
    ),
  ],
);
