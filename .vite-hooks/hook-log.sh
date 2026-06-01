hook_color_enabled=0

if [ -n "${FORCE_COLOR-}" ]; then
  unset NO_COLOR
  hook_color_enabled=1
elif [ -z "${NO_COLOR-}" ] && [ "${TERM-}" != "dumb" ] && [ -t 1 ]; then
  hook_color_enabled=1
fi

if [ "$hook_color_enabled" -eq 1 ]; then
  hook_blue="$(printf '\033[36m')"
  hook_green="$(printf '\033[32m')"
  hook_red="$(printf '\033[31m')"
  hook_dim="$(printf '\033[2m')"
  hook_reset="$(printf '\033[0m')"
else
  hook_blue=""
  hook_green=""
  hook_red=""
  hook_dim=""
  hook_reset=""
fi

hook_prefix() {
  hook_name="$1"
  hook_color="${2:-$hook_blue}"
  printf '%s[%s]%s' "$hook_color" "$hook_name" "$hook_reset"
}

print_hook_line() {
  hook_name="$1"
  hook_line="$2"
  hook_line_color=""

  case "$hook_line" in
    *"[FAILED]"* | *"✖"* | *"error:"* | *"Error:"* | *"failed"* | *"Failed"*)
      hook_line_color="$hook_red"
      ;;
    *"[COMPLETED]"* | *"pass:"* | *"passed"* | *"Passed"*)
      hook_line_color="$hook_green"
      ;;
    *"[STARTED]"*)
      hook_line_color="$hook_blue"
      ;;
    *"[SKIPPED]"* | *"warning:"* | *"Warning:"*)
      hook_line_color="$hook_dim"
      ;;
  esac

  printf '%s %s%s%s\n' \
    "$(hook_prefix "$hook_name" "${hook_line_color:-$hook_blue}")" \
    "$hook_line_color" \
    "$hook_line" \
    "$hook_reset"
}

run_hook_step() {
  hook_name="$1"
  shift

  hook_tmp="${TMPDIR:-/tmp}/narra-hook-${hook_name}-$$.log"

  printf '%s %s▶%s %s\n' "$(hook_prefix "$hook_name")" "$hook_dim" "$hook_reset" "$*"

  set +e
  if [ "$hook_color_enabled" -eq 1 ]; then
    "$@" >"$hook_tmp" 2>&1
  else
    NO_COLOR=1 "$@" >"$hook_tmp" 2>&1
  fi
  hook_status=$?
  set -e

  while IFS= read -r hook_line || [ -n "$hook_line" ]; do
    print_hook_line "$hook_name" "$hook_line"
  done <"$hook_tmp"

  rm -f "$hook_tmp"

  if [ "$hook_status" -eq 0 ]; then
    printf '%s %s✓%s passed\n' \
      "$(hook_prefix "$hook_name" "$hook_green")" \
      "$hook_green" \
      "$hook_reset"
    return 0
  fi

  printf '%s %s✗%s failed (exit %s)\n' \
    "$(hook_prefix "$hook_name" "$hook_red")" \
    "$hook_red" \
    "$hook_reset" \
    "$hook_status"
  return "$hook_status"
}
