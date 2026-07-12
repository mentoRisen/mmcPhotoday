export function actionErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "slot_taken":
      return "Toto stanovište a termín sú už obsadené potvrdenou rezerváciou.";
    case "photographer_busy":
      return "V tomto termíne už máš potvrdené iné fotenie.";
    case "invalid_action":
      return "Túto akciu nie je možné vykonať.";
    case "unknown":
      return "Akcia zlyhala. Skús to znova.";
    default:
      return null;
  }
}
